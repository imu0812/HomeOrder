import type {
  InventoryPackaging,
  InventoryProduct,
  InventoryTransaction,
  Order,
  OrderItem,
  OrderItemComponent,
  OrderMixItem,
  Packaging,
  PackagingBOMItem,
  Product,
  ProductBOMItem
} from "@/domain/types";

export interface ProductRepository {
  list(): Promise<Product[]>;
  findById(productId: string): Promise<Product | undefined>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(productId: string): Promise<void>;
}

export interface PackagingRepository {
  list(): Promise<Packaging[]>;
  findById(packagingId: string): Promise<Packaging | undefined>;
  create(packaging: Packaging): Promise<Packaging>;
  update(packaging: Packaging): Promise<Packaging>;
  delete(packagingId: string): Promise<void>;
}

export interface BomRepository {
  listProductBom(parentProductId: string): Promise<ProductBOMItem[]>;
  listPackagingBom(parentPackagingId: string): Promise<PackagingBOMItem[]>;
  replaceProductBom(parentProductId: string, items: ProductBOMItem[]): Promise<void>;
  replacePackagingBom(parentPackagingId: string, items: PackagingBOMItem[]): Promise<void>;
}

export interface OrderRepository {
  listOrders(): Promise<Order[]>;
  findOrder(orderId: string): Promise<Order | undefined>;
  listOrderItems(orderId: string): Promise<OrderItem[]>;
  findOrderItem(orderItemId: string): Promise<OrderItem | undefined>;
  listMixItems(orderItemId: string): Promise<OrderMixItem[]>;
  listComponents(orderId: string): Promise<OrderItemComponent[]>;
  createOrder(input: {
    order: Order;
    items: OrderItem[];
    mixItems?: OrderMixItem[];
  }): Promise<Order>;
  createOrderItem(input: {
    item: OrderItem;
    mixItems?: OrderMixItem[];
  }): Promise<OrderItem>;
  updateOrder(order: Order): Promise<Order>;
  updateOrderItem(orderItem: OrderItem): Promise<OrderItem>;
  replaceMixItems(orderItemId: string, mixItems: OrderMixItem[]): Promise<void>;
  replaceComponents(orderId: string, components: OrderItemComponent[]): Promise<void>;
}

export interface InventoryRepository {
  listProductInventory(): Promise<InventoryProduct[]>;
  listPackagingInventory(): Promise<InventoryPackaging[]>;
  getProductInventory(productId: string): Promise<InventoryProduct | undefined>;
  getPackagingInventory(packagingId: string): Promise<InventoryPackaging | undefined>;
  addReservedStock(itemType: "product" | "packaging", itemId: string, qty: number): Promise<void>;
  releaseReservedStock(itemType: "product" | "packaging", itemId: string, qty: number): Promise<void>;
  deductReservedStock(itemType: "product" | "packaging", itemId: string, qty: number): Promise<void>;
}

export interface TransactionRepository {
  list(): Promise<InventoryTransaction[]>;
  appendMany(transactions: InventoryTransaction[]): Promise<void>;
}

export type Repositories = {
  products: ProductRepository;
  packagings: PackagingRepository;
  bom: BomRepository;
  orders: OrderRepository;
  inventory: InventoryRepository;
  transactions: TransactionRepository;
};
