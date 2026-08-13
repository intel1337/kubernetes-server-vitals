npm run build
docker build -t api:latest .
docker tag api:latest i1337x/api:latest #Replace with your username
docker push i1337x/api:latest #Replace with your username 