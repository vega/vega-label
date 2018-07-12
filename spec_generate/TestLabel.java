import java.io.*;
import java.util.*;

class TestLabel {
	public static void main(String[] args) {
		PrintWriter writer;
		Random rand = new Random(0);
		Scanner console = new Scanner(System.in);
		System.out.print("Input size: ");
		int n = console.nextInt();

		try {
			String fileName = "test_label_" + n + ".vg.json";
			writer = new PrintWriter(fileName, "UTF-8");
			writer.println("[");

			for (int i = 0; i < n; i++) {
				double x = rand.nextDouble();
				double y = rand.nextDouble();
				int label = 10000 + i;
				writer.println("{\"year\":" + label + ",\"miles\":" + x + ",\"gas\":" + y + "}");
				if (i != n - 1) writer.println(",");
			}
			writer.println("]");

			writer.close();
		} catch (UnsupportedEncodingException e) {

		} catch (FileNotFoundException e) {

		}
	}
}