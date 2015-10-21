# Set up autotest node server parameters and start it
cd ..
node web/autotest.js --database 'postgres://localhost/autotest_test' --server_port 5000 --server_ip '127.0.0.1' --autotest_url '127.0.0.1:5000/interface' >/dev/null &
cd -

# Create an empty test database
./clone-database.sh > /dev/null

sleep 1

# Run the tests
mocha --reporter spec test.js --port=5000 --ip=127.0.0.1

# Stop the server
kill -SIGINT $!
