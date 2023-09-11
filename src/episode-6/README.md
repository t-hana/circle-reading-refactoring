# リファクタリングはじめの一歩

## 関数の抽出

- コードの断片を見て
- 何をしているのかを理解した上で
- 独立した関数として抽出し
- 目的にふさわしい名前をつける

### ※ 動機

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

### ※ 手順

- 新たな関数を作り、その意図に沿って命名する （どうやるか、ではなく何をするか）
  - 関数を一回呼び出すだけのコードであっても関数名で意図を適切に表現できるのであれば最初から適切な名前でなくても良い、使ってるうちに適切な名前が思い浮かぶときもある
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

### ◆ 例: スコープ外となる変数がない場合

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

### ◆ 例: ローカル変数を使用する場合

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

### ◆ 例: ローカル変数の再代入

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

## 変数の抽出

## 変数のインライン化

## 関数宣言の変更
