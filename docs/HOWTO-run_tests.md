There are current two ways to run tests, using either PostgreSQL or SQLite.

## PostgreSQL Testing (default, closer to most prod environments)

1. Install docker and docker compose
2. Run `docker-compose up -d` to start your development environment
3. Create the test database by running `./create_test_database.sh`
4. Run `yarn test`

## SQLite Testing (simpler)

1. Run `npm run test-sqlite`

## End-To-End (Interactive Browser) Testing

1. Remember to set `NODE_ENV=dev`
1. **Start DB** and **Start Spoke Server** as described in the [Getting Started](https://github.com/MoveOnOrg/Spoke/blob/main/README.md#getting-started) section.
1. Install browser driver(s)

   - Installing chromedriver on MacOS
     ```
     brew tap homebrew/cask
     brew cask install chromedriver
     ```
   - References
     - [Selenium HQ - JavaScript Docs](http://seleniumhq.github.io/selenium/docs/api/javascript/)
     - [Homebrew - Casks - chromedriver](https://github.com/Homebrew/homebrew-cask/blob/master/Casks/chromedriver.rb)

1. Running tests...

   - ... using your local browser
     ```
     npm run test-e2e
     ```
   - ... individually
     ```
     npm run test-e2e <test name>
     ```
   - ... using Sauce Labs browser with your local host

     **Note:** You must first setup [Sauce Labs](https://github.com/MoveOnOrg/Spoke/blob/main/docs/EXPLANATION-end-to-end-tests.md#saucelabs)

     ```
     export SAUCE_USERNAME=<Sauce Labs user name>
     export SAUCE_ACCESS_KEY=<Sauce Labs access key>
     npm run test-e2e <optional test name> --saucelabs
     ```
