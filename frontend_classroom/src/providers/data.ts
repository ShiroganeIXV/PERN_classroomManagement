import {createDataProvider, CreateDataProviderOptions} from "@refinedev/rest";
import {BACKEND_BASE_URL} from "@/constants";
import {CreateResponse, GetOneResponse, ListResponse} from "@/types";

if (!BACKEND_BASE_URL){
  throw new Error('BACKEND_BASE_URL is not defined');
}

const buildHttpError = async (response: Response) => {
  let message = 'Request failed'

  try{
    const payload = (await response.json()) as {message ?: string };

    if (payload?.message){
      message = payload.message;
    }
  }catch(error){
    console.error(error);
  }

  return{
    message,
    status: response.status,
  }
}

const options: CreateDataProviderOptions = {
  getList: {
    getEndpoint: ({ resource }) => resource,

    buildQueryParams: async ({resource, pagination, filters})=>{
      const page = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;

      const params: Record<string, string|number> = {page, limit: pageSize};

      filters?.forEach((filter)=>{
        const field = 'field' in filter ? filter.field : '';

        const value = String(filter.value);

        if(resource === 'subjects'){
          if (field === 'department') params.department = value;
          if (field === 'name' || field === 'code') params.search = value;
        }

        if (/^classes\/[^/]+\/users$/.test(resource) && field === 'role') {
          params.role = value;
        }
      })
      return params;

    },

    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await response.clone().json();
      return payload.data ?? [];
    },

    getTotalCount: async (response) => {
      if(!response.ok) throw await buildHttpError(response);

      const payload: ListResponse = await response.clone().json();
      return payload.pagination?.total ?? payload.data?.length ?? 0;
    },
  },

  getOne: {
    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response);

      const payload: GetOneResponse = await response.json();
      return payload.data;
    },
  },

  create: {
    getEndpoint: ({resource}) => resource,
    buildBodyParams: async ({variables}) => variables,
    mapResponse: async (response) => {
      const json : CreateResponse = await response.json();

      return json.data ?? [];

    }

  }


};

const {dataProvider} = createDataProvider(BACKEND_BASE_URL,options);

export {dataProvider}
