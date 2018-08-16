class Star:
    def __init__(self, name, ra, dec):
        self.name = name
        self.ra = ra
        self.dec = dec
        self.ra_num = int(float(ra)) if len(ra) > 0 else 0
        self.dec_num = int(float(dec) + 90) if len(dec) > 0 else 0
        self.star_count = 0


def main():
    f = open("./gaia_asteroids_pos_name.dat", "r")
    out = open("./gaia_asteroids_pos_name.json", "w")
    w, h = 370, 190
    bucket = [[0 for y in range(h)] for x in range(w)]
    stars = []
    first = True
    for line in f:
        if first:
            first = False
        else:
            fields = line.rstrip("\n\r").split(",")
            skip = False
            for field in fields:
                if len(field) == 0:
                    skip = True

            ra = fields[1]
            dec = fields[2]
            star = Star(fields[0], ra, dec)
            stars.append(star)
            if not skip:
                bucket[star.ra_num][star.dec_num] += 1
    SIZE = 10
    out.write("[\n")
    max_count = 0
    for s in stars:
        ra = s.ra_num
        dec = s.dec_num
        star_count = 0

        start_x = max(0, min(w, ra - SIZE))
        end_x = max(0, min(w, ra + SIZE))
        start_y = max(0, min(h, dec - SIZE))
        end_y = max(0, min(h, dec + SIZE))

        x = start_x
        while (x <= end_x):
            y = start_y
            while (y <= end_y):
                star_count += bucket[x][y]
                y += 1
            x += 1
        max_count = max(star_count, max_count)
        s.star_count = star_count

    count = 0
    for s in stars:
        name = '"' + s.name + '"' if len(s.name) > 0 else 'null'
        ra = s.ra if len(s.ra) > 0 else 'null'
        dec = s.dec if len(s.dec) > 0 else 'null'
        out.write('  {\n')
        out.write('    "denomination": ' + name + ',\n')
        out.write('    "ra": ' + ra + ',\n')
        out.write('    "dec": ' + dec + ',\n')
        out.write('    "density": ' + str(s.star_count / max_count) + '\n')
        out.write('  }')
        count += 1
        if count != len(stars):
            out.write(',')
        out.write('\n')

    out.write("]\n")
    out.close()
    f.close()


if __name__ == "__main__":
    main()
