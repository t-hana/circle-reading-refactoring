# API のリファクタリング

## 1 問い合わせと更新の分離

### 問い合わせと更新の分離の要約

問い合わせメソッドはそのまま情報を返すべく機能し、  
一方で更新メソッドは状態を変更するのみで、明示的な値を返すべきではないという形に分けます。  
このようにすることで、それぞれのメソッドが何をするのかが一目瞭然となり、コードの解釈とデバッグが容易になります。

```javascript
function getTotalOutstandingAndSendBill() {
  const result = customer.invoices.reduce((total, each)=>each.amount + total, 0);
  sendBill();
  return result;
}
```

↓↓↓↓↓↓↓↓↓↓↓↓↓↓

```javascript
function getTotalOutstanding() {
  return customer.invoices.reduce((total, each)=>each.amount + total, 0)
}

function sendBill() {
  emailGateway.send(formatBill(customer))
}
```

### 問い合わせと更新の分離の動機

あるメソッドや関数が状態を変更（更新）し、同時に何らかの値を返す（問い合わせ）ことを同時に行う場合  
これらの動作を二つの独立したメソッドまたは関数に分割すべきだと提唱します。

「コマンドとクエリの分離原則(mf-cqs)」と呼ばれるものです

### 問い合わせと更新の分離の手順

- 関数をコピーして、問い合わせ用の名前をつける
  - その関数が何を返すか調べる
  - 問い合わせの結果を変数に設定しているならその変数名が良いヒントになるはず
- 新しい問い合わせ関数から副作用をすべて除去する
- 静的検査を実行する
- 元の関数の呼び出しを調べる
  - 戻り値を使っている場合は、その呼び出しを問い合わせ関数の呼び出しに置き換え、元の関数の呼び出しをその後ろに挿入する
  - 変更のたびにテストする
- 元の関数から戻り値を削除する
- テストする

好ましからざる人物？のリストをスキャンする関数を例にします。  
一人でも見つけたらその人の名前を返して警報を返します。

```javascript
function alertForMiscreant (people) {
  for (const p of people) {
    if (p === "don") {
      setOffAlarms();
      return "Don"
    }
    if (p === "john") {
      setOffAlarms();
      return "John"
    }
  }
  return "";
}
```

コピーして関数名を変更

```javascript
function findMiscreant (people) {
  for (const p of people) {
    if (p === "don") {
      setOffAlarms();
      return "Don"
    }
    if (p === "john") {
      setOffAlarms();
      return "John"
    }
  }
  return "";
}
```

副作用の削除

```javascript
function findMiscreant (people) {
  for (const p of people) {
    if (p === "don") {
      return "Don"
    }
    if (p === "john") {
      return "John"
    }
  }
  return "";
}
```

```javascript
const found = alertForMiscreant(people);
```

関数の使用元を探し出し  

```javascript
const found = findMiscreant(people);
alertForMiscreant();
```

作成した関数を使用し  
元あった関数は呼び出すだけにします。

```javascript
function alertForMiscreant (people) {
  for (const p of people) {
    if (p === "don") {
      setOffAlarms();
      return;
    }
    if (p === "john") {
      setOffAlarms();
      return;
    }
  }
  return;
}
```

元の更新関数から戻り値を削除し完了です。

## 2 パラメータによる関数の統合

### パラメータによる関数の統合の要約

コード内の重複を最小限に抑えます。  
同じ操作を行う関数が複数存在する場合、それは更新とメンテナンスを難しくなります。  
たとえば、クラスが似たような役割を持つ複数のメソッドを持つ場合、  
その機能は一つの単一のメソッドに集約され、適切な引数を提供することでその挙動を制御することができます。

```javascript
function tenPercentRaise (aPerson) {
  aPerson.salary = aPerson.salary.multiply(1.1)
}
function fivePercentRaise (aPerson) {
  aPerson.salary = aPerson.salary.multiply(1.05)
}
```

```javascript
function raise (aPerson, factor) {
  aPerson.salary = aPerson.salary.multiply(1 + factor)
}
```

### パラメータによる関数の統合の動機

個々の関数が少し異なる動作をするだけであって、その違いがいくつかの値に依存する場合、  
それらの関数を一つにまとめることにより、呼び出し元の多くで同じ関数を使うことが可能になります。

これにより、コードの結果的な量が減少します。

### パラメータによる関数の統合の手順

- 類似関数のうち一つを選ぶ
- 関数宣言の変更(第6章)を適用してリテラル値をすべてパラメータに
- その関数を呼び出しているすべてのところで対応するリテラル値を渡す
- テストする
- 新しいパラメータを使用するように関数の本体を変更し、その度にテストする
- 類似の関数それぞれについて、元の関数呼び出しをパラメータ付きの関数呼び出しに置き換え、都度テストする
  - 適合しない場合はうまく調整する（？）

次のコードは  
usage(使用量)のband(帯域)別に設定される料率でamount(料金)を計算する

```javascript
function baseChange (usage) {
  if(usege < 0) return usd(0);
  const amount = 
        bottomBand(usage) * 0.03
        + middleBand(usage) * 0.05
        + topBand(usage) * 0.07
  return usd(amount)
}

function bottomBand(usage) {
  return Math.min(usage, 100)
}

function middleBand(usage) {
  return usage > 100 ? Math.min(usage, 200) - 100 : 0;
}

function topBand(usage) {
  return usage > 200 ? usage - 200 : 0;
}
```

middleBand は 100 と 200 というリテラルを2つ持っているので  
関数宣言の変更を適用して呼び出し時のパラメータに追加します

```javascript
function withinBand(usage, bottom, top) {
  return usage > 100 ? Math.min(usage, 200) - 100 : 0;
}

function baseChange (usage) {
  if(usege < 0) return usd(0);
  const amount = 
        bottomBand(usage) * 0.03
        + withinBand(usage, 100, 200) * 0.05
        + topBand(usage) * 0.07
  return usd(amount)
}
```

```javascript
function withinBand(usage, bottom, top) {
  return usage > bottom ? Math.min(usage, 200) - bottom : 0;
}
```

```javascript
function withinBand(usage, bottom, top) {
  return usage > bottom ? Math.min(usage, top) - bottom : 0;
}
```

```javascript
function baseChange (usage) {
  if(usege < 0) return usd(0);
  const amount = 
        withinBand(usage, 0, 100) * 0.03
        + withinBand(usage, 100, 200) * 0.05
        + topBand(usage) * 0.07
  return usd(amount)
}
```

```javascript
function baseChange (usage) {
  if(usege < 0) return usd(0);
  const amount = 
        withinBand(usage, 0, 100) * 0.03
        + withinBand(usage, 100, 200) * 0.05
        + withinBand(usage, 200, Infinity) * 0.07
  return usd(amount)
}
```

## 3 フラグパラメータの削除

### フラグパラメータの削除の要約

フラグパラメータは、一つの関数で複数の挙動を制御するには便利な手段ですが、  
これは同時にそれぞれの役割が一つの関数で混在するため、可読性を下げます。  
そして、フラグにより関数が異なる動きをするとき、それは異なる関数とすべきだと解説されています。

```javascript
function setDemension (name, value) {
  if(name === "height") {
    this._height = value;
    return;
  }
  if(name === "width") {
    this._width = value;
    return;
  }
}
```

```javascript
function setHeight (value) { this._height = value; }
function setWidth (value) { this._width = value; }
```

### フラグパラメータの削除の動機

フラグ引数は好ましくない

フラグ引数は真偽値を取る引数で、通常は関数がどのような行動をとるべきかを指示します。  
しかし、このようなフラグ引数は関数が複数の責任を持ってしまうことを示唆してしまいます。

### フラグパラメータの削除の手順

```javascript
aShipment.delivaryDate = delivaryDate(anOrder, true)
```

```javascript
aShipment.delivaryDate = delivaryDate(anOrder, false)
```

```javascript
function delivaryDate (anOrder, isRush) {
  if(isRush) {
    let delivaryTime;
    if (["MA","CT"].includes(anOrder.delivaryState)) delivaryTime = 1;
    else if (["NY","NH"].includes(anOrder.delivaryState)) delivaryTime = 2;
    else delivaryTime = 3;
    return anOrder.priceOn.plusDays(1 + delivaryTime)
  } else {
    let delivaryTime;
    if (["MA","CT","NY"].includes(anOrder.delivaryState)) delivaryTime = 2;
    else if (["ME","NH"].includes(anOrder.delivaryState)) delivaryTime = 3;
    else delivaryTime = 4;
    return anOrder.priceOn.plusDays(1 + delivaryTime)
  }
}
```

```javascript
function delivaryDate (anOrder, isRush) {
  let delivaryTime;
  if (isRush) return  rushDelivaryDateanOrder(anOrder);
  else regularDelivaryDate(anOrder);
}

function rushDelivaryDate (anOrder) {
  let delivaryTime;
  if (["MA","CT"].includes(anOrder.delivaryState)) delivaryTime = 1;
  else if (["NY","NH"].includes(anOrder.delivaryState)) delivaryTime = 2;
  else delivaryTime = 3;
  return anOrder.priceOn.plusDays(1 + delivaryTime)
}

function regularDelivaryDate (anOrder) {
  let delivaryTime;
  if (["MA","CT","NY"].includes(anOrder.delivaryState)) delivaryTime = 2;
  else if (["ME","NH"].includes(anOrder.delivaryState)) delivaryTime = 3;
  else delivaryTime = 4;
  return anOrder.priceOn.plusDays(1 + delivaryTime)
}
```

```javascript
aShipment.delivaryDate = delivaryDate(anOrder, true)
aShipment.delivaryDate = rushDelivaryDate(anOrder)
```

```javascript
const isRush = datermineIfRush(anOrder)
aShipment.delivaryDate = delivaryDate(anOrder, isRush)
```

```javascript
function delivaryDate (anOrder, isRush) {
  let result;
  let delivaryTime;
  if (anOrder.delivaryState === "MA" || anOrder.delivaryState === "CT") {
    delivaryTime = isRush ? 1 : 2;
  }
  else if (anOrder.delivaryState === "NY" || anOrder.delivaryState === "NH") {
    delivaryTime = 2;
    if (anOrder.delivaryState === "NH" && isRush) {
      delivaryTime = 3;
    }
  }
  else if (isRush) {
    delivaryTime = 3;
  }
  else if (anOrder.delivaryState === "ME") {
    delivaryTime = 3;
  } else {
    delivaryTime = 4;
  }
  result = anOrder.priceOn.plusDays(1 + delivaryTime)
  if(isRush) result = result.minusDays(1)
  return result
}
```

```javascript
function rushDelivaryDate (anOrder, ) { return delivaryDate(anOrder, true); }
function regularDelivaryDate (anOrder, ) { return delivaryDate(anOrder, false); }
```

## 4 オブジェクトそのものの受け渡し

### オブジェクトそのものの受け渡しの要約

関数が本来やるべきこと以上の情報を引数や戻り値として持たせる、つまり**情報の過多**について解説されています。

具体的には、ある関数がデータアイテムを個別に参照して渡す代わりに、  
それらを一つのオブジェクトとしてまとめて受け渡す手法が解説されています。

```javascript
const low = aRoom.daysTempRange.low
const high = aRoom.daysTempRange.high
if (aPlan.withinRange(low, high))
```

```javascript
if (aPlan.withinRange(aRoom.daysTempRange))
```

### オブジェクトそのものの受け渡しの動機

関数が同一のオブジェクトから多数のデータを取得して引数として受け取る場合  
そのデータをまとめて一つのオブジェクトとして扱いたい

### オブジェクトそのものの受け渡しの手順

## 5 問い合わせによるパラメータの置き換え

### 問い合わせによるパラメータの置き換えの要約

関数が要求できる情報の数を減らすことを説明しています。  

役割としては、引数の数が減ることで関数の使用を単純化し、  
また情報を直接クエリすることで、呼び出し側が余計な情報を持つ必要がなくなります。

ただ、この手法には注意点があり、関数本体で情報を取り出す動作が重い場合等は慎重に考える必要があります。

```javascript
function availableVacation (anEnployee, anEnployee.grade);

function availableVacation (anEnployee, grade) {
  // 休暇計算の処理
}
```

```javascript
function availableVacation (anEnployee);

function availableVacation (anEnployee) {
  const grade = anEnployee.grade
  // 休暇計算の処理
}
```

### 問い合わせによるパラメータの置き換えの動機

関数がパラメータとして何か特定の値を要求する際、その値が既に関数本体内で取得可能な他のオブジェクトから派生する情報の場合

### 問い合わせによるパラメータの置き換えの手順

## 6 パラメータによる問い合わせの置き換え

### パラメータによる問い合わせの置き換えの要約

ソースコードにおいて直接的な情報の収集（問い合わせ）を過度に依存することに制約をかけ、  
それを関数のパラメータとして受け取る形に変更するリファクタリング方法です。

この手法は、関数が自己完結型であること、つまり関数がその実行に必要なすべての情報をパラメータとして明示的に受け取ることで、依存性を最小限に抑えることを勧めています。

これにより、関数の再利用性が向上し、信頼性も高まります。

```javascript
targetTemperture(aPlan)

function targetTemperture (aPlan) {
  currentTemperture = thermostat.currentTemperture
  const grade = anEnployee.grade
  // 後続ロジック
}
```

```javascript
targetTemperture(aPlan, thermostat.currentTemperture)

function targetTemperture (aPlan, currentTemperture) {
  const grade = anEnployee.grade
  // 後続ロジック
}
```

### パラメータによる問い合わせの置き換えの動機

関数が直接データの問い合わせを行い、そのデータ取得のために顕著な依存関係を持っている場合

### パラメータによる問い合わせの置き換えの手順

## 7 setter の削除

### setter の削除の要約

setterメソッドはオブジェクト指向プログラミングで一般的に使われますが、  
オブジェクトの内部状態を直接変更し、カプセル化を妨げる可能性があります。  
ステートを直接操作すると、そのオブジェクトがどのように使用されるかを把握することが難しくなり、  
コードの理解とメンテナンスが困難になります。

この手法の推奨事項は、setterの代わりに「オブジェクトがどのように行動すべきか」を指示するメソッドを使用することです。  
これにより、オブジェクトが保有する直接の状態情報の露出を制限しつつ、オブジェクトに対する役割や行動の指示を明示化します。

```javascript
class Person {
  get name() {/* */}
  set name(aString) {/* */}
}
```

```javascript
class Person {
  get name() {/* */}
}
```

### setter の削除の動機

オブジェクトの状態が一定で変更すべきでない、または特定の条件下でのみ変更されるべきとき

### setter の削除の手順

## 8 ファクトリ関数によるコンストラクタの置き換え

### ファクトリ関数によるコンストラクタの置き換えの要約

コンストラクタの代わりにファクトリ関数を使用するというリファクタリング手法です。  
コンストラクタはオブジェクトの初期化を行うための特別なメソッドで、新しいオブジェクトを作成するたびに実行されます。

しかし、特定の場合にはコンストラクタだけではオブジェクトの作成に柔軟性が不足することがあります。

ファクトリ関数は、単なる関数でありながら、それが呼び出される度に新しいオブジェクトを作成できます。  
これにより、特定の条件に基づいて異なるタイプのオブジェクトを返すなど、オブジェクトの生成をより汎用性の高いものにすることが可能になります。

```javascript
leadEngineer = new Empliyee(document.leadEngineer, "E")
```

```javascript
leadEngineer = createEngineer(document.leadEngineer)
```

### ファクトリ関数によるコンストラクタの置き換えの動機

インスタンス化のロジックに条件分岐が含まれる場合。  
例えば、特定のパラメータに基づいて異なるサブクラスのインスタンスを作成する必要があるときなどです。

### ファクトリ関数によるコンストラクタの置き換えの手順

## 9 コマンドによる関数の置き換え

### コマンドによる関数の置き換えの要約

指示を表現するためのオブジェクト（コマンドオブジェクト）を作成し、そのオブジェクトが特定の動作を行うことで、ある関数を代替するリファクタリング手法です。  

この手法は特に、同じ操作を何度も行う場合や、操作が特定の条件に基づいて変化する場合、または操作を動的に組み替える必要がある場合に非常に有効です。

具体的には、操作の組み合わせが多数ある場合や、コードがユーザーの入力またはソフトウェアの状態によって行われる操作を制御する必要がある場合などに遅延処理または再試行の制御が必要とされます。

ファンクションよりもコマンドオブジェクトを使う利点の一つは、状態を持つことができるという点です。これにより、コマンドオブジェクトはその操作が何回も行われる際の一貫性を保つのに役立ちます。

この手法は適用するためには複雑さが伴うため、必要な場合にのみ検討するべきです。

```javascript
function score(candidate, miedicalExam, scoringGuide) {
  let rusult = 0;
  let helthLevel = 0;
  // 以下、長いコード
}
```

```javascript
class Scorer {
  constructor(candidate, miedicalExam, scoringGuide) {
    this._candidate = candidate
    this._miedicalExam = miedicalExam
    this._scoringGuide = scoringGuide
  }

  excute() {
    this._rusult = 0;
    this._helthLevel = 0;
    // 以下、長いコード
  }
}
```

### コマンドによる関数の置き換えの動機

- 制御フローが複雑な場合
  - If文やswitch文が多い関数
- 関数の実行を柔軟に制御する必要がある場合
  - 関数の実行を一時停止したり取り消したりと、制御フローをより柔軟に扱う必要がある場合
- のちに関数内の行動をパラメータ化したり、新たな行動を追加したりする可能性がある場合

### コマンドによる関数の置き換えの手順

## 10 関数によるコマンドの置き換え

### 関数によるコマンドの置き換えの要約

あるコマンドオブジェクトが行っている操作を、同じ操作を行う新しい関数で置き換えるというリファクタリング戦略です。

これは、一部の操作が詳細な状態管理や設定を必要とせず、単純な操作の組み合わせで行える場合に特に有用です。  
この場合、コマンドオブジェクトはオーバーキルとなり、単純に動作を行う関数に置き換えられます。

特定の状況や要求に対してコマンドオブジェクトが必要なくなった場合、それは関数に置き換えるべきです。  
結果として、より簡潔で読みやすく、保守しやすいコードになります。

```javascript
class ChargeCaluclator {
  constructor(customer, usage) {
    this._customer = customer
    this._usage = usage
  }

  excute() {
    return this._customer.rate * this._usage;
  }
}
```

```javascript
function charge(customer, usage) {
  return customer.rate * usage;
}
```

### 関数によるコマンドの置き換えの動機

- コマンドオブジェクトが過度に複雑になっている場合
  - 一連のコマンドオブジェクトが極めて単純な操作しか行っていない
  - または未使用のコマンドクラスが存在する
- コマンド間の状態共有が不要な場合
  - コマンドオブジェクトが互いに状態を共有する必要がない
  - もしくは共有する状態が非常に少ない
- 関数の柔軟性が十分な場合
  - コマンドオブジェクトが提供する柔軟性が不要
  - 単純な関数呼び出しによる機能実装が可能

### 関数によるコマンドの置き換えの手順
