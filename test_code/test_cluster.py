import random
n = str(input("Input size: "))
file = open("../data/test_label_cluster_3_" + n + ".json", "w")
n = int(n)
file.write("[\n")
for i in range(0, 100):
	x = str(random.uniform(0, n))
	y = str(random.uniform(0, n))
	label = str(i + n)
	file.write("    {\"year\":\"" + label + "\",\"miles\":" + x + ",\"gas\":" + y + "},\n")
end = n - 99
for i in range(0, end):
	x = str(i + (random.uniform(-0.1, 0.1) * n))
	y = str(i + (random.uniform(-0.1, 0.1) * n))

	label = str(i)
	file.write("    {\"year\":\"" + label + "\",\"miles\":" + x + ",\"gas\":" + y + "}")
	if i != end - 1:
		file.write(",\n")
file.write("\n]\n")
file.close()
