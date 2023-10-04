# API のリファクタリング

## 1 問い合わせと更新の分離

### 問い合わせと更新の分離の動機

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

修正前のコードは値を返すと同時に副作用があります。  
修正後のように値を返す関数は副作用を持ってはならないと言うようなルールを取り入れるべきです  
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

リテラル値が異なるだけの非常によく似たロジックを持つ関数が2つあるなら  
異なる値を渡すためのパラメータを持った一つの関数を用いることで重複を排除できます。

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
  } eles {
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

## 5 問い合わせによるパラメータの置き換え

## 6 パラメータによる問い合わせの置き換え

## 7 setter の削除

## 8 ファクトリ関数によるコンストラクタの置き換え

## 9 コマンドによる関数の置き換え

## 10 関数によるコマンドの置き換え
