Primary pill action button for KYN — use for the main action on any view; periwinkle by default.

```jsx
<Button variant="primary" size="md">Shop the collection</Button>
<Button variant="secondary">Build a set</Button>
<Button variant="ghost" size="sm">Learn more</Button>
<Button variant="pop">New drop</Button>            {/* rare, high-emphasis only */}
<Button iconLeft={<HeartIcon/>}>Add to favorites</Button>
```

Variants: `primary` (periwinkle, default), `secondary` (white + hairline), `ghost` (text-only), `pop` (magenta — at most one per view). Sizes: `sm` `md` `lg`. Pass `as="a"` + `href` for links.
