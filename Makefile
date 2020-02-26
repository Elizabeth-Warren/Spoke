# Makefile

build-image:
	./deploy-tools build-image
.PHONY: build-image

install-deps:
	./deploy-tools install-deps

build-app:
	./deploy-tools build-app
.PHONY: build-app

artifacts: build-image
	./deploy-tools extract-artifacts
.PHONY: artifacts

deploy-build:
	./deploy-tools deploy
.PHONY: deploy-build

deploy: build-app
	./deploy-tools deploy
.PHONY: deploy
