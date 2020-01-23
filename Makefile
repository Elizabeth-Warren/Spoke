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

preflight:
	./deploy-tools preflight
.PHONY: preflight

deploy: build-app
	./deploy-tools deploy
.PHONY: deploy
