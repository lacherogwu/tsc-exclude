## Installation

```bash
npm i -D tsc-exclude
```

## Usage

Add you ignore patterns to `tsconfig.json` exclude field, and run

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
