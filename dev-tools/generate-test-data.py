#!/usr/bin/env python3

import sys


def first_name(i):
    return f"Bailey{i}"


def last_name(i):
    return f"Warren{i}"


def phone_number(i):
    return f"+1555{i:07}"


def email(i):
    return f"goodboybailey{i}@blackhole.elizabethwarren.com"


def zip(i):
    return "02141"


fav_colors = ["red", "blue", "liberty-green", "orange", "purple", "yellow"]


def fav_color(i):
    return fav_colors[i % len(fav_colors)]


statecodes = ["MA", "NY", "IA", "CA", "NH", "DC", "FL"]


def statecode(i):
    return statecodes[i % len(statecodes)]


def main():
    if len(sys.argv) < 2 or sys.argv[1] == "-h" or sys.argv[1] == "--help":
        print("Usage: generate-test-data.py NUMBER_OF_CONTACTS > contacts.csv")
        return

    print(
        "first_name,last_name,phone_number,email,zip,fav_color,source_id_type,source_id,van_statecode"
    )
    for i in range(int(sys.argv[1])):
        print(
            f"{first_name(i)},{last_name(i)},{phone_number(i)},{email(i)},{zip(i)},{fav_color(i)},custom,{i},{statecode(i)}"
        )


if __name__ == "__main__":
    main()
