def main():
    file_name = str(input("File name: "))
    f = open("../runtime_test/test_result" + file_name + ".txt", "r")
    out = open("../runtime_test/test_result" + file_name + ".json", "w")

    out.write("[\n")

    first = True
    for line in f:
        phrase = line.split()
        infos = phrase[1][:-1].split("_")
        time = phrase[2][: -2]

        if not first:
            out.write(",\n")
        first = False

        if int(infos[2]) % 2 == 0:
            shape = 'uniform'
        else:
            shape = 'clustered'

        out.write('  {\n')
        out.write('    "method": "' + infos[1] + '-based' + '",\n')
        out.write('    "input_shape": "' + shape + '",\n')
        out.write('    "input_size": ' + infos[2] + ',\n')
        out.write('    "width": ' + infos[3][1:] + ',\n')
        out.write('    "height": ' + infos[4][1:] + ',\n')
        out.write('    "run": ' + infos[5][1:] + ',\n')
        out.write('    "time": ' + time + '\n')
        out.write('  }')
    
    out.write("\n]\n")


if __name__ == "__main__":
    main()