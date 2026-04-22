import { nowIso } from "@/lib/utils";
import type { InventoryTransaction, Order, OrderItem, OrderItemComponent, OrderMixItem } from "@/domain/types";
import type { Repositories } from "../interfaces";
import { mockDb } from "./mockData";

function recalcAvailable(currentStock: number, reservedStock: number) {
  return currentStock - reservedStock;
}

export const mockRepositories: Repositories = {
  products: {
    async list() {
      return mockDb.products;
    },
    async findById(productId) {
      return mockDb.products.find((product) => product.productId === productId);
    }
  },
  packagings: {
    async list() {
      return mockDb.packagings;
    },
    async findById(packagingId) {
      return mockDb.packagings.find((packaging) => packaging.packagingId === packagingId);
    }
  },
  bom: {
    async listProductBom(parentProductId) {
      return mockDb.productBomItems
        .filter((item) => item.parentProductId === parentProductId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    },
    async listPackagingBom(parentPackagingId) {
      return mockDb.packagingBomItems
        .filter((item) => item.parentPackagingId === parentPackagingId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }
  },
  orders: {
    async listOrders() {
      return [...mockDb.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async findOrder(orderId) {
      return mockDb.orders.find((order) => order.orderId === orderId);
    },
    async listOrderItems(orderId) {
      return mockDb.orderItems.filter((item) => item.orderId === orderId);
    },
    async listMixItems(orderItemId) {
      return mockDb.orderMixItems.filter((item) => item.orderItemId === orderItemId);
    },
    async listComponents(orderId) {
      const orderItemIds = mockDb.orderItems.filter((item) => item.orderId === orderId).map((item) => item.id);
      return mockDb.orderItemComponents.filter((component) => orderItemIds.includes(component.orderItemId));
    },
    async createOrder(input: { order: Order; items: OrderItem[]; mixItems?: OrderMixItem[] }) {
      mockDb.orders.push(input.order);
      mockDb.orderItems.push(...input.items);
      mockDb.orderMixItems.push(...(input.mixItems ?? []));
      return input.order;
    },
    async updateOrder(order) {
      const index = mockDb.orders.findIndex((item) => item.orderId === order.orderId);
      if (index >= 0) mockDb.orders[index] = order;
      return order;
    },
    async replaceComponents(orderId: string, components: OrderItemComponent[]) {
      const orderItemIds = mockDb.orderItems.filter((item) => item.orderId === orderId).map((item) => item.id);
      mockDb.orderItemComponents = mockDb.orderItemComponents.filter(
        (component) => !orderItemIds.includes(component.orderItemId)
      );
      mockDb.orderItemComponents.push(...components);
    }
  },
  inventory: {
    async listProductInventory() {
      return mockDb.inventoryProducts;
    },
    async listPackagingInventory() {
      return mockDb.inventoryPackagings;
    },
    async getProductInventory(productId) {
      return mockDb.inventoryProducts.find((item) => item.productId === productId);
    },
    async getPackagingInventory(packagingId) {
      return mockDb.inventoryPackagings.find((item) => item.packagingId === packagingId);
    },
    async addReservedStock(itemType, itemId, qty) {
      const now = nowIso();
      if (itemType === "product") {
        const inventory = mockDb.inventoryProducts.find((item) => item.productId === itemId);
        if (!inventory) return;
        inventory.reservedStock += qty;
        inventory.availableStock = recalcAvailable(inventory.currentStock, inventory.reservedStock);
        inventory.updatedAt = now;
        return;
      }
      const inventory = mockDb.inventoryPackagings.find((item) => item.packagingId === itemId);
      if (!inventory) return;
      inventory.reservedStock += qty;
      inventory.availableStock = recalcAvailable(inventory.currentStock, inventory.reservedStock);
      inventory.updatedAt = now;
    },
    async releaseReservedStock(itemType, itemId, qty) {
      const now = nowIso();
      if (itemType === "product") {
        const inventory = mockDb.inventoryProducts.find((item) => item.productId === itemId);
        if (!inventory) return;
        inventory.reservedStock = Math.max(0, inventory.reservedStock - qty);
        inventory.availableStock = recalcAvailable(inventory.currentStock, inventory.reservedStock);
        inventory.updatedAt = now;
        return;
      }
      const inventory = mockDb.inventoryPackagings.find((item) => item.packagingId === itemId);
      if (!inventory) return;
      inventory.reservedStock = Math.max(0, inventory.reservedStock - qty);
      inventory.availableStock = recalcAvailable(inventory.currentStock, inventory.reservedStock);
      inventory.updatedAt = now;
    },
    async deductReservedStock(itemType, itemId, qty) {
      const now = nowIso();
      if (itemType === "product") {
        const inventory = mockDb.inventoryProducts.find((item) => item.productId === itemId);
        if (!inventory) return;
        inventory.currentStock = Math.max(0, inventory.currentStock - qty);
        inventory.reservedStock = Math.max(0, inventory.reservedStock - qty);
        inventory.availableStock = recalcAvailable(inventory.currentStock, inventory.reservedStock);
        inventory.updatedAt = now;
        return;
      }
      const inventory = mockDb.inventoryPackagings.find((item) => item.packagingId === itemId);
      if (!inventory) return;
      inventory.currentStock = Math.max(0, inventory.currentStock - qty);
      inventory.reservedStock = Math.max(0, inventory.reservedStock - qty);
      inventory.availableStock = recalcAvailable(inventory.currentStock, inventory.reservedStock);
      inventory.updatedAt = now;
    }
  },
  transactions: {
    async list() {
      return mockDb.transactions;
    },
    async appendMany(transactions: InventoryTransaction[]) {
      mockDb.transactions.push(...transactions);
    }
  }
};
