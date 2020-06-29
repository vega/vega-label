import pandas as pd
import numpy as np
from os.path import join

BASE_DIR = './benchmark_results/results'
RESULTS_DIR = join(BASE_DIR, 'results.json')

ORDER = {
    "particle": 0,
    "improvedParticle": 1,
    "pixel": 2
}
GB_FIELDS = ["chart_width", "labeler"]


def sort_size_labeler(df):
    df['labeler_order'] = df['labeler'].map(ORDER)
    return df.sort_values(["chart_width", "labeler_order"]).drop(columns='labeler_order')


def aggregate(data, labeler1: str, labeler2: str):
    data = data[(data['labeler'] == labeler1) | (data['labeler'] == labeler2)]

    data_gb = data.groupby(GB_FIELDS, as_index=False)
    # data_runtime = sort_size_labeler(data_gb["runtime"].median())
    # data_placed = sort_size_labeler(data_gb["placed"].median())
    # print(data_runtime)
    # print(data_placed)

    data_agg = sort_size_labeler(data_gb.aggregate({"runtime": ["median"], "placed": ["median"]}))
    print(data_agg)

    widths = data_agg["chart_width"].unique()
    print(widths)

    array = data_agg.to_numpy()
    array = np.concatenate((array, np.zeros((array.shape[0], 6))), axis=1)
    for i in range(int(array.shape[0] // 2)):
        baseline_runtime = array[i * 2, 2]
        comparing_runtime = array[i * 2 + 1, 2]

        particle_placed = array[i * 2, 3]
        pixel_placed = array[i * 2 + 1, 3]

        diff_runtime = (-baseline_runtime + comparing_runtime) * 100 / baseline_runtime
        center_runtime = (baseline_runtime + comparing_runtime) / 2.0
        diff_placed = (-particle_placed + pixel_placed) * 100 / particle_placed
        center_placed = (particle_placed + pixel_placed) / 2.0

        array[i * 2, 4] = diff_runtime
        array[i * 2, 5] = diff_placed
        array[i * 2, 6] = center_runtime
        array[i * 2, 7] = comparing_runtime
        array[i * 2, 8] = center_placed
        array[i * 2, 9] = pixel_placed

        array[i * 2 + 1, 4] = diff_runtime
        array[i * 2 + 1, 5] = diff_placed
    print(array)

    new_col = ["chart_width", "labeler", "runtime", "placed", "diff_runtime", "diff_placed", "center_runtime", "pixel_runtime", "center_placed", "pixel_placed"]
    pd.DataFrame(data=array, columns=new_col).to_csv(join(BASE_DIR, f"aggregated_results_{labeler1}_{labeler2}.csv"))


def main():
    with open(RESULTS_DIR, 'r') as f:
        data = pd.read_json(f)

    aggregate(data, 'particle', 'pixel')
    aggregate(data, 'particle', 'improvedParticle')
    aggregate(data, 'improvedParticle', 'pixel')


if __name__ == '__main__':
    main()
