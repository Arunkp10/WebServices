import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;;

class TestSubmit
{  
	public static void main(String args[]) throws Exception
	{
		System.out.println("Creating Firefox driver");
		FirefoxDriver driver = new FirefoxDriver ();

		System.out.println("Loading page");
		driver.get ("http://192.168.1.3:8080/test?id=23");

		System.out.println("Title: " + driver.getTitle ());

		WebElement toggle = driver.findElementByClassName ("dropdown-toggle");
		WebElement link = driver.findElementById ("test-submit");
		WebDriverWait wait = new WebDriverWait (driver, 60);

		while (true)
		{
			System.out.println("Submitting test");
			wait.until (ExpectedConditions.elementToBeClickable (toggle));
			toggle.click ();
			wait.until (ExpectedConditions.elementToBeClickable (link));
			link.click ();

			System.out.print("Waiting for progress to appear ... ");
			wait.until (ExpectedConditions.textToBePresentInElementLocated (By.cssSelector ("#runs-table > tbody > tr:first-child > td:nth-child(3)"), "0 / 2"));
			WebElement submitted = driver.findElementByCssSelector ("#runs-table > tbody > tr:first-child > td:first-child");
			System.out.printf("progress found for submission: %s\n", submitted.getText ());

			System.out.printf ("Waiting for progress to move to 1 / 2 ... ");
			wait.until (ExpectedConditions.textToBePresentInElementLocated (By.cssSelector ("#runs-table > tbody > tr:first-child > td:nth-child(3)"), "1 / 2"));
			System.out.printf ("found\n");

			System.out.printf ("Waiting for progress to move to 2 / 2 ... ");
			wait.until (ExpectedConditions.textToBePresentInElementLocated (By.cssSelector ("#runs-table > tbody > tr:first-child > td:nth-child(3)"), "2 / 2"));
			System.out.printf ("found\n");

			System.out.printf ("Completed, waiting for next run\n");

			Thread.sleep (2000);
		}
	}
}

