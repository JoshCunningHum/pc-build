start:
    docker build --build-arg VITE_APP_NAME="{{ env_var_or_default("VITE_APP_NAME", "PC Build") }}" -t pc-build .
    docker run --rm -p 3000:80 --name pc-build pc-build
