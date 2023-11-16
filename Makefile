.PHONEY: run fastmail

run:
	python3 -m http.server 8080

fastmail: index.html script.js styles.css playlist.txt
	cp -u -v -t /net/fastmail/www/yt/ $^