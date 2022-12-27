FROM node:14

ENV TZ=Asia/Taipei

RUN apt-get update && apt-get upgrade -y

RUN apt install -y build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libreadline-dev libffi-dev wget libbz2-dev

COPY ./install_dependency.sh ./
RUN chmod +x ./install_dependency.sh
RUN ./install_dependency.sh

EXPOSE 3000
EXPOSE 2000-2020
EXPOSE 10000-10100
# PYTHON=python3.7 npm install mediasoup@3 --save