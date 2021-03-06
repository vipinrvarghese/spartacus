import {
  AUTH_SERVICE,
  CUSTOMER_COUPON_SERVICE,
  NGRX_STORE,
  SPARTACUS_CORE,
  STORE,
} from '../../../../shared/constants';
import { ConstructorDeprecation } from '../../../../shared/utils/file-utils';

export const CUSTOMER_COUPON_SERVICE_MIGRATION: ConstructorDeprecation = {
  class: CUSTOMER_COUPON_SERVICE,
  importPath: SPARTACUS_CORE,
  deprecatedParams: [
    {
      className: STORE,
      importPath: NGRX_STORE,
    },
  ],
  addParams: [
    {
      className: AUTH_SERVICE,
      importPath: SPARTACUS_CORE,
    },
  ],
};
