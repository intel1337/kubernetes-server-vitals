docker build -t decoy-a:latest ./decoy-a
docker build -t decoy-b:latest ./decoy-b
docker build -t decoy-c:latest ./decoy-c

docker tag decoy-a:latest i1337x/decoy-a:latest #Replace with your username
docker tag decoy-b:latest i1337x/decoy-b:latest #Replace with your username
docker tag decoy-c:latest i1337x/decoy-c:latest #Replace with your username

docker push i1337x/decoy-a:latest #Replace with your username
docker push i1337x/decoy-b:latest #Replace with your username
docker push i1337x/decoy-c:latest #Replace with your username