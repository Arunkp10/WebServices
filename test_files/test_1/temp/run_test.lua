--[[
Example S3 locations of gems:

http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.6/RMS_5.1.0.beta.6.dmg
http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.6/RMS_5.1.0.beta.6.exe
http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.6/rhoapi-modules-js-5.1.0.beta.6.js
http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.6/rhoconnect-client-5.1.0.beta.6.gem
http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.6/rhodes-5.1.0.beta.6.gem
http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.6/rhodes-containers-5.1.0.beta.6.gem
http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.6/rhoelements-5.1.0.beta.6.gem
--]]

-- Create empty directory
os.execute ('cmd /c rmdir /s /q c:\\native-test-harness & mkdir c:\\native-test-harness')

-- Download RMS-Testing repository
--source = testagent.git_download ({path = 'c:/native-test-harness', owner = 'rhomobile', repository = 'RMS-Testing'})
--os.execute ('cmd /c move /y "' .. source ..'" c:\\native-test-harness\\RMS-Testing > nul')
--testagent.log ('info', 'RMS-Testing repository fetched')
    
-- Download gems
testagent.url_download ({path = 'c:/native-test-harness/rhodes.gem', url = 'http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.13/rhodes-5.1.0.beta.13.gem'})
testagent.url_download ({path = 'c:/native-test-harness/rhoelements.gem', url = 'http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.13/rhoelements-5.1.0.beta.13.gem'})
testagent.url_download ({path = 'c:/native-test-harness/rhoconnect-client.gem', url = 'http://rhomobile-suite.s3.amazonaws.com/5.1/5.1.0.beta.13/rhoconnect-client-5.1.0.beta.13.gem'})
testagent.log ('info', 'Gems downloaded')

-- Uninstall existing gems
os.execute ('cmd /c gem uninstall rhodes --all --ignore-dependencies --executables')
os.execute ('cmd /c gem uninstall rhoelements --all --ignore-dependencies --executables')
os.execute ('cmd /c gem uninstall rhoconnect-client --all --ignore-dependencies --executables')
testagent.log ('info', 'Gems uninstalled')

-- Install new ones
os.execute ('cmd /c gem install c:/native-test-harness/rhodes.gem --no-rdoc --no-ri')
os.execute ('cmd /c gem install c:/native-test-harness/rhoelements.gem --no-rdoc --no-ri')
os.execute ('cmd /c gem install c:/native-test-harness/rhoconnect-client.gem --no-rdoc --no-ri')
testagent.log ('info', 'Gems installed')

-- Get rhodes gem installation information
gem_output = testagent.get_package_path () .. '\\gem.txt'
os.execute ('cmd /c gem list ^rhodes$ --detail --local > "' .. gem_output .. '"')
version = nil
location = nil
fin = assert (io.open (gem_output), 'Gem list output not found')
for line in fin:lines () do
  match = string.match (line, '^rhodes %((.*)%)')
  if match then
    version = match
  end
  match = string.match (line, 'Installed at: (.*)$')
  if match then
    location = match
  end
end
fin:close ()

-- Check that the version and location information were found
if not version or not location == nil then
  testagent.log ('error', 'Version and location not found from gem list')
  return
end
testagent.log ('info', 'Rhodes gem version ' .. version .. ' in ' .. location)

-- Create rhobuild.yml in the rhodes gem directory
rhobuild_path = location .. '/gems/rhodes-' .. version
testagent.configure_rho ({path = rhobuild_path})
testagent.log ('info', 'Rho configured for building')

-- Assume the overall process has passed until we find otherwise
pass = true

-- Execute the Windows build process, redirecting all output
--build_output = testagent.get_package_path () .. '\\build.txt'
--command = 'cmd /c cd c:\\native-test-harness-git\\native_test_harness & rake clean:wm & rake device:wm:production > "' .. build_output ..'" 2>&1'
--os.execute (command)
--testagent.log ('info', 'Windows build completed')

-- Process the Windows build results. Check for a line with 'error' and log it, then fail
--fin = assert (io.open (build_output, 'r'), 'Build output file not found')
--for line in fin:lines () do
--  if string.find (line, 'error %u%d+') then
--    testagent.log ('error', line)
--    pass = false
--  end
--end
--fin:close ()
--testagent.log ('info', 'Windows build analysis completed')

-- Check for presence of output binary
--fin = assert (io.open ('c:\\native-test-harness-git\\native_test_harness\\bin\\target\\MC3000c50b (ARMV4I)\\Native Test Harness.cab', 'r'), 'Windows build output not found')
--fin:close ()

-- Upload output to S3
--command = 'cmd /c aws s3 cp "c:\\native-test-harness-git\\native_test_harness\\bin\\target\\MC3000c50b (ARMV4I)\\Native Test Harness.cab" ' ..
--    's3://zebra-ats3/NativeTestHarness/NativeTestHarness.cab'
--os.execute (command)
--testagent.log ('info', 'Windows output copied to S3')

-- Execute the Android build process, redirecting all output
build_output = testagent.get_package_path () .. '\\build.txt'
command = 'cmd /c cd c:\\native-test-harness-git\\native_test_harness & rake clean:android & rake device:android:production > "' .. build_output ..'" 2>&1'
os.execute (command)
testagent.log ('info', 'Android build completed')

-- Process the Android build results. Check for a line with 'error' and log it, then fail
fin = assert (io.open (build_output, 'r'), 'Build output file not found')
for line in fin:lines () do
  if string.find (line, 'error: ') then
    testagent.log ('error', line)
    pass = false
  end
end
fin:close ()
testagent.log ('info', 'Android build analysis completed')

-- Check for presence of output binary
fin = assert (io.open ('c:\\native-test-harness-git\\native_test_harness\\bin\\target\\android\\Native Test Harness_signed.apk', 'r'), 'Android build output not found')
fin:close ()

-- Upload output to S3
command = 'cmd /c aws s3 cp "c:\\native-test-harness-git\\native_test_harness\\bin\\target\\android\\Native Test Harness_signed.apk" s3://zebra-ats3/NativeTestHarness/NativeTestHarness.apk'
os.execute (command)
testagent.log ('info', 'Android output copied to S3')

testagent.outcome ('pass')
testagent.log ('info', 'Build completed')