import random
n = str(input("Input size: "))
file = open("../data/test_label_cluster_" + n + ".vg.json", "w")
n = int(n)
file.write("[\n")
for i in range(0, n):
	x = str(i + (random.uniform(-0.1, 0.1) * n))
	y = str(i + (random.uniform(-0.1, 0.1) * n))

	label = str(i)
	file.write("    {\"year\":\"" + label + "\",\"miles\":" + x + ",\"gas\":" + y + "}")
	if i != n - 1:
		file.write(",\n")
file.write("]\n")
file.close()
