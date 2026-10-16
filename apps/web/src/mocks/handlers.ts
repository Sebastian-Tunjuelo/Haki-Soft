import { http, HttpResponse } from 'msw';
import { mockClientTaskPublication, mockTaskOrderCard } from '@taskstream/shared-schemas';

const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Adaptador MSW de Fase 0: FE-1 consume contratos reales mientras BE termina los módulos. */
export const handlers = [
  http.get(`${api}/api/v1/contracts/sample-publication`, () => {
    return HttpResponse.json(mockClientTaskPublication());
  }),
  http.get(`${api}/api/v1/contracts/sample-order`, () => {
    return HttpResponse.json(mockTaskOrderCard());
  }),
];
