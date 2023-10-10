class Product {
  constructor(name, stock) {
    this.name = name;
    this.stock = stock;
  }

  // 状態を変更するメソッド
  decreaseStock(quantity) {
    if (this.isStockSufficient(quantity)) {
      this.stock -= quantity;
    }
  }

  // 状態を問い合わせるメソッド
  isStockSufficient(quantity) {
    return this.stock >= quantity;
  }
}

const product = new Product("Book", 100);

if (product.isStockSufficient(5)) {
  product.decreaseStock(5);
  // 処理成功
} else {
  // 処理失敗
}

/*
ここでは decreaseStock メソッドを更新処理だけを行うコマンドに、
isStockSufficient メソッドを状態を問い合わせるクエリに分割しました。

これにより、問い合わせとコマンドが明確に分割され、コードの振る舞いがより直感的になりました。
*/
