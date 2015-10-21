#!/bin/bash

# Copy structure of database to test database
pg_dump --dbname=autotest --schema-only --exclude-table="test_result_*" --no-owner --no-privileges --no-acl --no-tablespaces --clean | sed 's/DROP SCHEMA .*[^;]/& CASCADE/' | psql autotest_test
