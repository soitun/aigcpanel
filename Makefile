

test:
	npm run build:preview 2>&1 | tail -20

build_and_install:
	npm run build;
	rm -rfv /Applications/AigcPanel.app;
	cp -a ./dist-release/mac-arm64/AigcPanel.app /Applications
