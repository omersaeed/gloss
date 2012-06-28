LESS = $(shell find . -name '*.less' -not -path 'vendor/*')
LESSC ?= $(shell which lessc)

less: $(LESS:.less=.css)

%.css: %.less
	$(LESSC) $< > $@

