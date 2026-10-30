import express from 'express';
import {and, desc, eq, getTableColumns, ilike, or, sql, SQL} from "drizzle-orm";
import {departments, subjects} from "../db/schema";
import {db} from "../db";

const router = express.Router();

router.get("/", async (req,res) => {
    try{
        const {search, department, page = 1, limit = 10} = req.query;

        const currentPage = Math.max(1,+page)
        const limitPerPage = Math.max(1, +limit)

        const offset = (currentPage - 1) * limitPage

        const filterConditions: (SQL | undefined)[] = [];

        // if search query exists, filter by subject name OR subject code
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            );
        }

        // if department query exists, match department name
        if (department) {
            filterConditions.push(
                ilike(departments.name, `%${department}%`)
            );
        }

        // Combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(subjects)
            .leftJoin(departments, eq(subjects.description, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const subjectList = await db.select({
            ...getTableColumns(subjects),
            department:{...getTableColumns(departments)}
        }).from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
        })

    }catch (e) {
        console.error(`Get subjects error: ${e}`);
        res.status(500).json("Failed to get subjects");
    }
})
