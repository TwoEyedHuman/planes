.PHONY: dev build deploy

dev:
	npm run dev

build:
	npm run build

deploy: build
	fly deploy
