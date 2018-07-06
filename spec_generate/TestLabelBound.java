import java.io.*;

class TestLabelBound {
	public static void main(String[] args) {
		PrintWriter writer;
		try {
			writer = new PrintWriter("test_label_bound.json", "UTF-8");
			writer.println("[");

			for (int i = 0; i < 100; i++) {
				writer.println("{\"year\": 8008, \"miles\": " + i + ", \"gas\": 50.0},");
				writer.print("{\"year\": 8008, \"miles\": 50.0, \"gas\": " + i + "}");
				if (i != 99) writer.println(",");
			}
			writer.println("]");

			writer.close();
		} catch (UnsupportedEncodingException e) {

		} catch (FileNotFoundException e) {

		}
	}
}