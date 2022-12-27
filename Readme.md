##
```
docker exec -it $CONTAIONERNAME bin/bash
```

- package.json should add description

- openssl generate keys
- https://linuxconfig.org/how-to-generate-a-self-signed-ssl-certificate-on-linux
```
openssl req -x509 -newkey rsa:2048 -keyout keytmp.pem -out cert.pem -days 365
```