# Google Sheets 初始化模板

## Users
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | 使用者 ID |
| username | string | 是 | 登入帳號 |
| passwordHash | string | 是 | 密碼雜湊 |
| role | enum | 是 | admin / staff |
| isActive | boolean | 是 | 是否啟用 |
| createdAt | datetime | 是 | 建立時間 |

## Products
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| productId | string | 是 | 商品 ID |
| productCode | string | 是 | 商品代碼 |
| productName | string | 是 | 商品名稱 |
| productType | enum | 是 | single / bundle / custom_bundle_template |
| unit | string | 是 | 單位 |
| price | number | 是 | 售價 |
| safeStock | number | 是 | 安全庫存 |
| isCompositeProduct | boolean | 是 | 是否組合商品 |
| isActive | boolean | 是 | 是否啟用 |
| remark | string | 否 | 備註 |

## ProductBOM
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | BOM 明細 ID |
| parentProductId | string | 是 | 父商品 ID |
| childProductId | string | 是 | 子商品 ID |
| qty | number | 是 | 單位用量 |
| sortOrder | number | 是 | 排序 |

## Packagings
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| packagingId | string | 是 | 包材 ID |
| packagingCode | string | 是 | 包材代碼 |
| packagingName | string | 是 | 包材名稱 |
| packagingType | enum | 是 | single_packaging / gift_box / bag / accessory |
| unit | string | 是 | 單位 |
| currentStock | number | 是 | 目前庫存 |
| reservedStock | number | 是 | 已預留 |
| safeStock | number | 是 | 安全庫存 |
| isComposite | boolean | 是 | 是否組合包裝 |
| isActive | boolean | 是 | 是否啟用 |
| remark | string | 否 | 備註 |

## PackagingBOM
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | BOM 明細 ID |
| parentPackagingId | string | 是 | 父包裝 ID |
| childPackagingId | string | 是 | 子包材 ID |
| qty | number | 是 | 單位用量 |
| sortOrder | number | 是 | 排序 |

## InventoryProducts
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | 庫存列 ID |
| productId | string | 是 | 商品 ID |
| currentStock | number | 是 | 目前庫存 |
| reservedStock | number | 是 | 已預留 |
| availableStock | number | 是 | currentStock - reservedStock |
| updatedAt | datetime | 是 | 更新時間 |

## InventoryPackagings
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | 庫存列 ID |
| packagingId | string | 是 | 包材 ID |
| currentStock | number | 是 | 目前庫存 |
| reservedStock | number | 是 | 已預留 |
| availableStock | number | 是 | currentStock - reservedStock |
| updatedAt | datetime | 是 | 更新時間 |

## Orders
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| orderId | string | 是 | 訂單 ID |
| orderNo | string | 是 | 訂單編號 |
| customerName | string | 是 | 客戶姓名 |
| customerPhone | string | 是 | 聯絡電話 |
| pickupDate | date | 是 | 取貨日期 |
| orderStatus | enum | 是 | draft / confirmed / shipped / cancelled |
| paymentStatus | enum | 是 | unpaid / paid |
| totalAmount | number | 是 | 訂單總額 |
| orderMode | enum | 是 | normal / fixed_bundle / custom_mix |
| note | string | 否 | 備註 |
| createdAt | datetime | 是 | 建立時間 |
| createdBy | string | 是 | 建立者 |

## OrderItems
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | 明細 ID |
| orderId | string | 是 | 訂單 ID |
| productId | string | 是 | 商品 ID |
| productNameSnapshot | string | 是 | 商品名稱快照 |
| qty | number | 是 | 數量 |
| unitPrice | number | 是 | 單價 |
| subtotal | number | 是 | 小計 |
| packagingId | string | 否 | 包裝 ID |
| packagingNameSnapshot | string | 否 | 包裝名稱快照 |
| remark | string | 否 | 備註 |

## OrderMixItems
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | 混搭明細 ID |
| orderItemId | string | 是 | 訂單明細 ID |
| productId | string | 是 | 單品商品 ID |
| productNameSnapshot | string | 是 | 商品名稱快照 |
| qty | number | 是 | 數量 |
| unit | string | 是 | 單位 |
| sortOrder | number | 是 | 排序 |

## OrderItemComponents
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| id | string | 是 | 快照 ID |
| orderItemId | string | 是 | 訂單明細 ID |
| itemType | enum | 是 | product / packaging |
| itemId | string | 是 | 商品或包材 ID |
| itemNameSnapshot | string | 是 | 名稱快照 |
| qty | number | 是 | 展開數量 |
| sourceType | enum | 是 | single / product_bom / packaging_bom / custom_mix |

## InventoryTransactions
| 欄位名稱 | 型別 | 必要 | 說明 |
|---|---|---:|---|
| txnId | string | 是 | 交易 ID |
| itemType | enum | 是 | product / packaging |
| itemId | string | 是 | 商品或包材 ID |
| txnType | enum | 是 | in / reserve / release / deduct / adjust |
| qty | number | 是 | 數量 |
| refType | enum | 是 | order / manual / init |
| refId | string | 是 | 來源 ID |
| note | string | 否 | 備註 |
| createdAt | datetime | 是 | 建立時間 |
| createdBy | string | 是 | 建立者 |
