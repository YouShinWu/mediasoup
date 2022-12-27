wget https://www.python.org/ftp/python/3.7.4/Python-3.7.4.tgz
tar -xf Python-3.7.4.tgz
cd Python-3.7.4
./configure --enable-optimizations
make install

wget https://bootstrap.pypa.io/pip/get-pip.py
python3.7 get-pip.py

cd ../
wget https://github.com/Kitware/CMake/releases/download/v3.20.0/cmake-3.20.0.tar.gz
tar -xf cmake-3.20.0.tar.gz
cd cmake-3.20.0
./bootstrap
make
make install

cd /cmake-3.20.0/bin
mv * /usr/bin