# Тренировки — веб-сервер. Сертификат HTTPS Caddy получает и продлевает сам.
{
	email __EMAIL__
}

__SITE__ {
	encode gzip
	header {
		Strict-Transport-Security "max-age=31536000"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}
	@api path /auth/v1/* /rest/v1/* /health
	handle @api {
		reverse_proxy 127.0.0.1:8787
	}
	handle {
		root * /var/www/training
		@fresh path / /index.html /sw.js /manifest.webmanifest
		header @fresh Cache-Control "no-cache"
		file_server
	}
}

#WWW www.__DOMAIN__ {
#WWW 	redir https://__DOMAIN__{uri} permanent
#WWW }
