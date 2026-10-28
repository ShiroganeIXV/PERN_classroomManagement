import { Subject } from "@/types";

export const DEPARTMENTS = [
    'CS',
    'Math',
    'Physics'
];

export const DEPARTMENT_OPTIONS = DEPARTMENTS.map(dept => ({
    value: dept,
    label: dept
}));

export const MOCK_SUBJECTS: Subject[] = [
    {
        id: 1,
        code: 'CS101',
        name: 'Introduction to Computer Science',
        department: 'CS',
        description: 'An introductory course covering fundamental programming concepts, algorithms, and computational problem-solving.',
        createdAt: '2024-01-15T08:00:00.000Z'
    },
    {
        id: 2,
        code: 'MATH201',
        name: 'Linear Algebra',
        department: 'Math',
        description: 'A comprehensive study of vector spaces, linear transformations, matrices, determinants, and systems of linear equations.',
        createdAt: '2024-01-15T09:00:00.000Z'
    },
    {
        id: 3,
        code: 'PHYS101',
        name: 'Classical Mechanics',
        department: 'Physics',
        description: 'A foundational physics course exploring Newtonian mechanics, motion, energy, momentum, and rotational dynamics.',
        createdAt: '2024-01-15T10:00:00.000Z'
    }
];

export const mockSubjects = MOCK_SUBJECTS;