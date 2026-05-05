import type { Repositories } from "../interfaces";

function notImplemented(): never {
  throw new Error("Google Sheets repository stub is reserved for the next integration round.");
}

export const googleSheetsRepositories: Repositories = {
  products: {
    list: async () => notImplemented(),
    findById: async () => notImplemented(),
    create: async () => notImplemented(),
    update: async () => notImplemented(),
    delete: async () => notImplemented()
  },
  packagings: {
    list: async () => notImplemented(),
    findById: async () => notImplemented(),
    create: async () => notImplemented(),
    update: async () => notImplemented(),
    delete: async () => notImplemented()
  },
  bom: {
    listProductBom: async () => notImplemented(),
    listPackagingBom: async () => notImplemented(),
    replaceProductBom: async () => notImplemented(),
    replacePackagingBom: async () => notImplemented()
  },
  orders: {
    listOrders: async () => notImplemented(),
    findOrder: async () => notImplemented(),
    listOrderItems: async () => notImplemented(),
    findOrderItem: async () => notImplemented(),
    listMixItems: async () => notImplemented(),
    listComponents: async () => notImplemented(),
    createOrder: async () => notImplemented(),
    createOrderItem: async () => notImplemented(),
    updateOrder: async () => notImplemented(),
    updateOrderItem: async () => notImplemented(),
    replaceMixItems: async () => notImplemented(),
    replaceComponents: async () => notImplemented()
  },
  inventory: {
    listProductInventory: async () => notImplemented(),
    listPackagingInventory: async () => notImplemented(),
    getProductInventory: async () => notImplemented(),
    getPackagingInventory: async () => notImplemented(),
    addReservedStock: async () => notImplemented(),
    releaseReservedStock: async () => notImplemented(),
    deductReservedStock: async () => notImplemented()
  },
  transactions: {
    list: async () => notImplemented(),
    appendMany: async () => notImplemented()
  }
};
