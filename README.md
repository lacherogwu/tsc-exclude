## Installation

```bash
npm i -D tsc-exclude
```

## Usage

Add your ignore patterns to `tsconfig.json` exclude field

```json
{
	"exclude": ["../api/**", "../../node_modules/**"]
}
```

Then pipe the output of `vue-tsc` to `tsc-exclude`

```bash
vue-tsc --pretty | tsc-exclude
```

or use npm script

```json
{
	"scripts": {
		"lint": "vue-tsc --pretty | tsc-exclude"
	}
}
```

## Roadmap

- [ ] Apply stream
