# API のリファクタリング

## 1 問い合わせと更新の分離

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

## 2 パラメータによる関数の統合

## 3 フラグパラメータの削除

## 4 オブジェクトそのものの受け渡し

## 5 問い合わせによるパラメータの置き換え

## 6 パラメータによる問い合わせの置き換え

## 7 setter の削除

## 8 ファクトリ関数によるコンストラクタの置き換え

## 9 コマンドによる関数の置き換え

## 10 関数によるコマンドの置き換え


