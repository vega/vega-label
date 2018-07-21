import random
n = str(input("Input size: "))
file = open("../data/test_label_" + n + ".json", "w")
n = int(n)
file.write("[\n")
for i in range(0, n):

	x = str(random.uniform(0, 1))
	y = str(random.uniform(0, 1))
	label = str(i)
	file.write("{\"year\":" + label + ",\"miles\":" + x + ",\"gas\":" + y + "}")
	if i != n - 1:
		file.write(",\n")
file.write("\n]\n")
file.close()
