# リファクタリングはじめの一歩

## 関数の抽出

- コードの断片を見て
- 何をしているのかを理解した上で
- 独立した関数として抽出し
- 目的にふさわしい名前をつける

### ※ 関数の抽出の動機

いつコードを独立した関数として出すか？

あるガイドラインでは

- 関数は一画面に収まる
- 2回以上使われるコードはそれ自体を関数に

のように再利用に基づいています。

しかし最も納得できるのは **意図と実装の分離** であり

何をしているか調べないとわからないコードの場合、  
何をしているかを示す名前で関数を抽出すべきです。

#### ◆ Smalltalk の例

Smalltalk はプログラム言語で、白黒のコンソールだけの画面（コンソール上で動く？

例えば文字を強調したい時に、グラフィック関連のクラスに **highlight** と言うメソッドがあり、それで反転処理されて強調を表していましたが、こちらの中身は **reverse** メソッド を呼び出しているだけでメソッド名のほうが長い状態でした。それでも **reverse** の意図とこの実装には大きな違いがあるので

小さい関数の場合、関数呼び出しコストが問題になることがありましたが
今は稀で、コンパイラでは小さい関数のほうがキャッシュしやすく、かえってうまくいく場合もあります。

ただし、このような小さな関数は名前が良くないと意味がありません

### ※ 関数の抽出の手順

- 新たな関数を作り、その意図に沿って命名する （どうやるか、ではなく何をするか）
  - 関数を一回呼び出すだけのコードであっても関数名で意図を適切に表現できるのであれば実施
  - 最初から適切な名前でなくても良い、使ってるうちに適切な名前が思い浮かぶときもある
  - まずは**抽出して使ってみる**こと、うまくいかなければインライン化してもとに戻せばいい
    - **その過程で学ぶことがあれば時間の無駄ではない**
  - 関数定義の入れ子をサポートするのであれば元の関数内に入れ子にする
    - そうすることで **関数の移動** があとから容易に実施できる (8章)
- 抽出したいコードを、元の関数から新たな関数にコピーする
- 抽出したいコードを調べ、元の関数ではスコープ内、新しい関数ではスコープ外になる変数を特定しパラメータとして渡す
  - 抽出した関数を元の関数の入れ子にすると必要がない
  - たいていの場合、ローカル変数や関数のパラメータである
    - 汎用的なやり方 → すべてをパラメータ化
    - コードの中で宣言されている場合はコード内に
    - 代入される値が値渡しになっているかも注意、場合によっては戻り値を変数に代入等も考える。
    - 抽出したコード内で代入されるローカル変数が多すぎる時などは抽出は諦めた方がいい
      - **変数の分離** (9章)や **問い合わせによる一時変数の置き換え** (7章) で対応する
- (変数を処置したらコンパイル)
- テスト
- 残りのコードから類似したコードを探し出す
  - **関数呼び出しによるインラインコードの書き換えを適用する** を適用する (8章)

#### ◆ 例: スコープ外となる変数がない場合

```js
function printOwing(invoice) {
  let outstanding = 0;
  console.log("***********************");
  console.log("**** Customer Owes ****");
  console.log("***********************");

  // 未払金の計算
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }

  // 締め日の記録 (record duw date)
  const today = Clock.today;
  invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);


  // 明細の印字 (print details)
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
  console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
}
```

バナーを印字する(printBanner)コードを抽出するのは簡単でカット＆ペーストで呼び出しを追加するだけ
同様に 明細の印字(printDetails) も抽出できます

```js
function printOwing(invoice) {
  let outstanding = 0;

  printBanner();

  // 未払金の計算
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }

  // 締め日の記録 (record duw date)
  const today = Clock.today;
  invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

  printDetails();



  // 明細の印字 (print details)
  function printDetails() {
    console.log(`name: ${invoice.customer}`);
    console.log(`amount: ${outstanding}`);
    console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
  }
}

function printBanner() {
  console.log("***********************");
  console.log("**** Customer Owes ****");
  console.log("***********************");
}
```

この例だと printDetails を printOwing に入れ子で定義しましたが  
入れ子が使えない言語等の場合この方法は不可能 → トップレベルに抽出が必要  

- 元の関数のスコープにしかないすべての変数に注意が必要
  - 元の関数に渡されている引数
  - 関数内で定義される一時変数

#### ◆ 例: ローカル変数を使用する場合

ローカル変数があっても、参照はするけど再代入されないのであれば  

```js
function printOwing(invoice) {
  let outstanding = 0;

  printBanner();

  // 未払金の計算
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }

  // 締め日の記録 (record duw date)
  const today = Clock.today;
  invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

  // 明細の印字 (print details)
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
  console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
}
```

パラメータで渡せばいいだけなので簡単です。

```js
function printOwing(invoice) {
  let outstanding = 0;

  printBanner();

  // 未払金の計算
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }

  // 締め日の記録 (record duw date)
  const today = Clock.today;
  invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

  printDetails(invoice, outstanding);
}

function printDetails(invoice, outstanding) {
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
  console.log(`due: ${invoice.dueDate.toLocaleDateString()}`);
}
```

ローカル変数が構造体（配列やオブジェクト）でそれに変更を加えていた場合も同じで  
同様に recordDueDate も抽出できます

```js
function printOwing(invoice) {
  let outstanding = 0;

  printBanner();

  // 未払金の計算
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }

  // 締め日の記録 (record duw date)
  recordDueDate(invoice);
  printDetails(invoice, outstanding);
}

function recordDueDate(invoice) {
  const today = Clock.today;
  invoice.dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
}
```

#### ◆ 例: ローカル変数の再代入

ここでは一時変数に限定して話を進めます  
パラメータに代入している場合は「**変数の分離**(9章)」を施して一時変数に変換します。

代入される一時変数には

- 抽出されるコード内でのみ使われる変数
- 変数が参照されているところから離れたところで初期化された変数
  - この場合は ステートメントのスライド(8章)を使って変数へのすべての操作をまとめる

厄介なのは、抽出した関数以外でも使われる変数  
この場合、新たな値として返す必要があります。

```js
function printOwing(invoice) {
  let outstanding = 0;

  printBanner();

  // 未払金の計算
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }

  // 締め日の記録 (record duw date)
  recordDueDate(invoice);
  printDetails(invoice, outstanding);
}

```

計算している行の近くに宣言を移動します  
それと計算部分をまとめてコピーした関数を作ります。

```js
function printOwing(invoice) {
  
  printBanner();

// 未払金の計算
- let outstanding = 0;
- for (const o of invoice.orders) {
-   outstanding += o.amount;
- }

  // 締め日の記録 (record duw date)
  recordDueDate(invoice);
  printDetails(invoice, outstanding);
}

function culculateOutstanding(invoice) {
  let outstanding = 0;
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }
  return outstanding
}
```

この関数により ↑ の - のコードを削除し outstanding に代入します

```js
function printOwing(invoice) {
  printBanner();
  
  let outstanding = culculateOutstanding(invoice)
  recordDueDate(invoice);
  printDetails(invoice, outstanding);
}
```

戻り値の名前を普段のコーディングスタイルに
再代入されることはなくなるので let を const に変更して完了です

```js
function printOwing(invoice) {
  printBanner();
  
  const outstanding = culculateOutstanding(invoice)
  recordDueDate(invoice);
  printDetails(invoice, outstanding);
}

function culculateOutstanding(invoice) {
  let result = 0;
  for (const o of invoice.orders) {
    result += o.amount;
  }
  return result
}
```

## 関数のインライン化

分けすぎた関数をもとに戻す

関数のインライン化はうまく分離できていない関数群があるときにも使われます。  
一度、それらすべての一つの大きな関数にインライン化してから  
より望ましい関数群として再抽出すればいい

通常、関数のインライン化を使うのは、間接化しすぎた結果  
どの関数も別の関数へ委譲しているしているだけにしか見えず  
委譲に次ぐ委譲の途中で道に迷ってしまうようなときです。

インライン化してみることで有効な間接化を洗い出し、残りを取り除くことができます。

### ※ 関数のインライン化の手順

- 関数がポリモーフィックなメソッドでないことを確認する
  - これがクラスのメソッドで、サブクラスでオーバーライドされているとインライン化はできません
- この関数の呼び出し元をすべて見つける
- 関数の各呼び出し元を関数の中身で置き換える
- 一つ置き換えるごとにテストする
  - すべてのインライン化を一度にする必要はない
  - 一部のインライン化がやりにくいようであれば機会を持って徐々に勧めてもよい
- 関数の定義を取り除く

#### ◆ 例

単純なケースでは下記のようなものです。

```js
function rating(aDriver) {
  return moreThanFiveLateDeliveries(aDriver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(aDriver) {
  return aDriver.numberOfLateDeliveries > 5;
}
```

呼ばれる関数のリターン式を、呼び出し元に置き換えるだけです

```js
function rating(aDriver) {
  return aDriver.numberOfLateDeliveries > 5 ? 2 : 1;
}
```

もう少し入り組んだケースの場合、  
下記のように新たな住まいに適合させるための作業が必要になります  

```js
function rating(aDriver) {
  return moreThanFiveLateDeliveries(aDriver) ? 2 : 1;
}

function moreThanFiveLateDeliveries(dvr) {
  return dvr.numberOfLateDeliveries > 5;
}
```

ほとんど同じですが引数名が異なるため調整が必要になります。

```js
function rating(aDriver) {
  return aDriver.numberOfLateDeliveries > 5 ? 2 : 1;
}
```

さらに入り組んだケースもあります。

```js
function reportLines(aCustomer) {
  const lines = [];
  getherCustomerData(lines, aCustomer);
  return lines;
}

function getherCustomerData(out, aCustomer) {
  out.push("name", aCustomer.name)
  out.push("location", aCustomer.location)
}
```

getherCustomerData (顧客データの集約) を  
reportLines (レポート行)に集約するには単純なカット＆ ペーストではすみません  

しかし慎重さを期すため一行ずつ移すのも悪くないでしょう

まずは ステートメントの呼び出し側への移動 (8章) を最初の行に施します。

```js
function reportLines(aCustomer) {
  const lines = [];
+ lines.push("name", aCustomer.name)
  getherCustomerData(lines, aCustomer);
  return lines;
}

function getherCustomerData(out, aCustomer) {
- out.push("name", aCustomer.name)
  out.push("location", aCustomer.location)
}
```

で、残りの行も移動して完成です。

```js
function reportLines(aCustomer) {
  const lines = [];
  lines.push("name", aCustomer.name)
+ lines.push("location", aCustomer.location)
- getherCustomerData(lines, aCustomer);
  return lines;
}

function getherCustomerData(out, aCustomer) {
- out.push("location", aCustomer.location)
}
```

```js
function reportLines(aCustomer) {
  const lines = [];
  lines.push("name", aCustomer.name)
  lines.push("location", aCustomer.location)
  return lines;
}
```

## 変数の抽出

### ※ 変数の抽出の動機

コード内の式に名前をつけたいとき  

#### ◆ 変数の抽出の期待される効果

- 同じ式を何度も書かなくて良くなる
- 変数名により見ただけで式がわかりやすくなり、コメントが不要になる

### ※ 変数の抽出の手順

- 抽出しようとする式に副作用がないことを確認する
- 変更不可な変数を定義する、名付けたい式の値をその変数に設定する
- 元の式を新しい変数で置き換える
- テストする

```js
function price(order) {
  // price = base price - quantity discount + shipping
  return order.quantity * order.itemPrice -
    Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
    Math.min(order.quantity * order.itemPrice * 0.1, 100);
}
```

元々単純な計算ではありますが、まだ読みやすくできます  
まず、basePrice(本体価格) は quantity(数量) と itemPrice(単価)をかけたものなので  
変数を作成し名付けることで、理解したことをコードに反映させます  

```js
function price(order) {
  // price = base price - quantity discount + shipping
  const basePrice = order.quantity * order.itemPrice;
  return order.quantity * order.itemPrice -
    Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
    Math.min(order.quantity * order.itemPrice * 0.1, 100);
}
```
  
この時点では宣言しただけなので何も起きません  
同じ式の部分を変数に置き換えます

```js
function price(order) {
  // price = base price - quantity discount + shipping
  const basePrice = order.quantity * order.itemPrice;
  return basePrice -
    Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
    Math.min(order.quantity * order.itemPrice * 0.1, 100);
}
```

同じ式がもう一度使われているのでこれも置き換えます

```js
function price(order) {
  // price = base price - quantity discount + shipping
  const basePrice = order.quantity * order.itemPrice;
  return basePrice -
    Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
    Math.min(basePrice * 0.1, 100);
}
```

次は quantityDiscount(数量値引)で、これも抽出できます。

```js
function price(order) {
  // price = base price - quantity discount + shipping
  const basePrice = order.quantity * order.itemPrice;
  const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
  return basePrice -
    quantityDiscount +
    Math.min(basePrice * 0.1, 100);
}
```

最後に shipping(送料)も変数化します。  
これでコメントが書かれたコード以上のことを表していないので削除可になります。

```js
function price(order) {
  const basePrice = order.quantity * order.itemPrice;
  const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
  const shipping = Math.min(basePrice * 0.1, 100);
  return basePrice - quantityDiscount + shipping;
}
```

#### ◆ 例 クラスのコンテキストで

```js
class Order {
  constructor(aRecord) {
    this._data = aRecord;
  }

  get quantity() {return this._data.quantity;}
  get itemPrice() {return this._data.itemPrice;}

  get price() {
    return this.basePrice - this.quantityDiscount + this.shipping;
  }
  
  get basePrice() {
    return order.quantity * order.itemPrice -
      Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
      Math.min(order.quantity * order.itemPrice * 0.1, 100);
  }
}
```

このケースでも同様に抽出できます。  
ただし、こうした名前はこのOrderクラスの全体で通用することがわかったので  
変数ではなくメソッドとして抽出します。

```js
class Order {
  constructor(aRecord) {
    this._data = aRecord;
  }

  get quantity() {return this._data.quantity;}
  get itemPrice() {return this._data.itemPrice;}

  get price() {
    return this.basePrice - this.quantityDiscount + this.shipping;
  }

  get basePrice() {return this.quantity * this.itemPrice; }
  get quantityDiscount() {return Math.max(0, order.quantity - 500) * order.itemPrice * 0.05; }
  get shipping() {return Math.min(basePrice * 0.1, 100); }
}
```

これはオブジェクトのすぐれた利点の一つ  
ロジックはオブジェクトに与えられた適切な大きさのコンテキストを通じて、他のロジックやデータを共有でき、オブジェクトに対して多くの共通な振る舞いを、いつでも名前で参照できる抽象として呼び出すことができます。

```js
const record = {
  quantity: 5,
  itemPrice: 1000
};
const anOrder = new Order(record); // インスタンス化

anOrder.basePrice // quantity * itemPrice = 5000

```

## 変数のインライン化

### ※ 変数のインライン化の動機

変数化しなくても名前でわかるような時

### ※ 変数のインライン化の手順

- 代入の右辺に副作用がないことを確認
- その変数が変更不可と宣言されていない場合、変更不可にしてテスト
  - これにより代入が一度きりかどうかの確認
- その変数に最初の参照を探し、代入の右辺と置き換える
- 変数の宣言と代入を取り除く
- テストする

```js
let basePrice = anOrder.basePrice
return (basePrice > 1000)
```

↓

```js
return anOrder.basePrice > 1000
```

## 関数宣言の変更

関数の名前を変更したり、パラメータを追加・削除・変更したりすることです。  
これにより、よりわかりやすい名前を使用したり、関数の振る舞いをより正確に表現したりすることができます。

### ※ 関数宣言の変更の動機

- 関数名の改善
  - 関数名がその機能を正確に反映していない、またはより良い名前を思いついた時
    - 名前でわかれば、それが何をしているかの謎解きをしなくてよくなる
- パラメータの追加
  - 新たな機能を実装したり、既存機能を改善するために新たな引数が必要な時
- パラメータの追加と削除
  - パラメータがなくても適切に動作したり、パラメータが冗長であった時
- パラメータの最順序
  - 引数の順序を変更すると、

### ※ 関数宣言の変更の手順

#### ◆ 簡易な手順

- パラメータを削除する場合、それが関数内部で参照されていないかを確認
- 関数宣言を望ましいものに変更
- 古い関数宣言へのすべての参照を探し、新しいものに更新
- テストする

#### ◆ 移行的手順

- 必要であれば関数本体をリファクタリング
  - 以降の抽出のステップを実施しやすくしておく
- 関数本体に **関数の抽出** を実施、新たな関数を作成
  - 新たな関数の名前を古いものと同じにするならわかり易い名前で一時的に
- 抽出した関数に追加のパラメータが必要な場合、簡易な手順で追加を行う
- テストする
- 古い関数に **関数のインライン化** を実施
- 一時的な関数名にした場合、**関数宣言の変更** を実施し元の名前に
- テストする

##### 例： 関数名の変更(簡易な手順)

```js
function circum(radius) {
  return 2 * Math.PI * radius
}
```

式を見れば円周を計算するものですが  
名前が circum だと周囲という意味なので  

```js
function circumference(radius) {
  return 2 * Math.PI * radius
}
```

円周という名前に変更しました。  
そして circum を呼び出しているところを探し出し circumference に変更しました。

この簡易な手順の欠点はすべての呼び出し箇所と宣言を一度に変更しないといけない

##### 例： 関数名の変更(移行的手順)

```js
function circum(radius) {
  return 2 * Math.PI * radius
}
```

まずは関数の抽出を実施し

```js
function circum(radius) {
  return circumference(radius)
}
function circumference(radius) {
  return 2 * Math.PI * radius
}
```

これで古い関数を呼び出している箇所を探し出し置き換えます。
すべて置き換えが終わったら circum を消すことができます。

この方法だと、書き換えは一つずつできて、都度都度のテストが可能になります。

##### 例： パラメータの追加

```js
class Book {
  addReservation(customer);
}
```

図書管理のBookクラスには 貸出予約を受け付ける addReservation メソッドがあります  
この予約に優先度付き待ち行列をサポートを追加します

```js
class Book {
  addReservation(
    this.zz_addReservation(customer)
  );
  zz_addReservation(
    this._reservations.push(customer)
  );
}
```

関数の抽出を施し新たな関数を作ります  
同名にはできないので後で見つけやすい一時的な名前をつけます。

```js
class Book {
  addReservation(
    this.zz_addReservation(customer, false)
  );
  zz_addReservation(customer, isPriority) (
    this._reservations.push(customer)
  );
}
```

宣言と呼び出しにパラメータ追加

JSの場合、呼び出し側を変更する前に アサーションの導入(10章)を施し  
新たなパラメータが呼び出し側で設定されているかのチェックする

```js
class Book {
  zz_addReservation(customer, isPriority) (
    assert(isPriority === true || isPriority === false)
    this._reservations.push(customer)
  );
}
```

こうすることでパラメータの入れ忘れがあるとアサーションが間違いを教えてくれます。

これで元の関数に対して **関数のインライン化** を実施します。  
呼び出し側も一つずつ変更できます。

##### 例： パラメータをプロパティに変更する

顧客がニューイングランド出身かを判定する関数があります

```js
function inNewEngland(aCustomer) {
  return ["MA","CT","ME","VT","NH","RI"].includes(aCustomer.address.state)
}

const newEnglanders = aCustomer.filter(c => inNewEngland(c) )

```

inNewEngland をリファクタリングし顧客に依存しないようにします

```js
function inNewEngland(aCustomer) {
  return ["MA","CT","ME","VT","NH","RI"].includes(aCustomer.address.state)
}

const newEnglanders = aCustomer.filter(c => inNewEngland(c) )
```

関数名の変更の最初の一手は関数の抽出を適用することですが  
この関数は本体をすこしリファクタリングすることであとが楽になります。  
変数の抽出を実施し新たなパラメータを抽出します

```js
function inNewEngland(aCustomer) {
  const stateCode = aCustomer.address.state
  return ["MA","CT","ME","VT","NH","RI"].includes(stateCode)
}

const newEnglanders = someCustomer.filter(c => inNewEngland(c) )
```

そしてここで関数の抽出

```js
function inNewEngland(aCustomer) {
  const stateCode = aCustomer.address.state
  return xxNewEngland(stateCode)
}

function xxNewEngland(stateCode) {
  return ["MA","CT","ME","VT","NH","RI"].includes(stateCode)
}
```

そして元の関数の入力パラメータに変数のインライン化を実施します

```js
function inNewEngland(aCustomer) {
  return xxNewEngland(aCustomer.address.state)
}

function xxNewEngland(stateCode) {
  return ["MA","CT","ME","VT","NH","RI"].includes(stateCode)
}
```

次に関数のインライン化を使って古い関数の中身を呼び出し側に  
これで一つずつ置き換えができるようになります

```js
const newEnglanders = someCustomer.filter(c => xxNewEngland(c.address.state))
```

すべての置き換えが完了したら
xxNewEngland から inNewEngland に関数宣言の変更を実施して完了です。
