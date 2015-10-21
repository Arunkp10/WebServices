# Pause, then update test
sleep 1
curl --silent -d "operation=update_run&run_id=$autotest_run_id&status=running" $autotest_url
sleep 1
curl --silent -d "operation=update_run&run_id=$autotest_run_id&status=done&outcome=pass" $autotest_url
