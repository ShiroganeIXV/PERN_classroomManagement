import React from 'react'
import {ListView} from "@/components/refine-ui/views/list-view.tsx";
import {Breadcrumb} from "@/components/ui/breadcrumb.tsx";
import {CreateButton} from "@/components/refine-ui/buttons/create.tsx";

function List() {
    return (
        <div>

            List

            <ListView>
                <Breadcrumb />
                <div className="flex items-center justify-between">
                    <h1 className="page-title">Classes</h1>
                    <CreateButton resource="classes" />
                </div>
            </ListView>


        </div>
    )
}

export default List
