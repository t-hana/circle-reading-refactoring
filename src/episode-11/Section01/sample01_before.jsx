class Product {
  constructor(name, stock) {
    this.name = name;
    this.stock = stock;
  }

  // 状態を変更しつつ値も返すメソッド
  decreaseStock(quantity) {
    if (this.stock >= quantity) {
      this.stock -= quantity;
      return true;
    } else {
      return false;
    }
  }
}

const product = new Product("Book", 100);
const success = product.decreaseStock(5);

/*
この decreaseStock メソッドは
在庫が引数 quantity よりも多い場合に在庫を減らし (this.stock -= quantity;)、
在庫が十分あったかどうかを返します (return true;).

このメソッドは問い合わせ処理と更新処理が混在しています。
*/
