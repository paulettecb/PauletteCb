The signature KYN commerce tile — serif product name, price, color swatches, optional status badge and favorite button, with a soft hover lift.

```jsx
<ProductCard
  name="Waterproof Collar"
  description="Original biothane + solid brass. Rinse & go."
  price="$25"
  badge={<Badge tone="brand">Best Seller</Badge>}
  favIcon={<Heart/>}
  swatches={['#8795D2','#CFE0F2','#F4F0E8','#CFE8DA']}
  media={<img src="/collar.png" alt="Lilac waterproof collar" />}
/>
```

Pass a real `<img>` as `media`; falls back to the oat media area when omitted. Use one `badge` max.
