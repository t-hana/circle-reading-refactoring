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

## 3 フラグパラメータの削除

## 4 オブジェクトそのものの受け渡し

## 5 問い合わせによるパラメータの置き換え

## 6 パラメータによる問い合わせの置き換え

## 7 setter の削除

## 8 ファクトリ関数によるコンストラクタの置き換え

## 9 コマンドによる関数の置き換え

## 10 関数によるコマンドの置き換え
