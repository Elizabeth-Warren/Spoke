#!/usr/bin/env python3

import csv
import re
import sys, getopt

# Open details file and get a unique set of links
phone_numbers_set = set();
phone_number_regex = re.compile(r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})')

def processFile(INFILE, OUTFILE, TESTMODE=False):
  with open(OUTFILE, 'w') as dedupe_csvfile:
    fieldnames = ['first_name', 'last_name', 'phone_number', 'source_id_type', 'source_id']
    writer = csv.DictWriter(dedupe_csvfile, fieldnames=fieldnames)

    if (TESTMODE != True):
      writer.writeheader()
    
    with open(INFILE, 'rb') as csvfile:
      csvreader = csv.DictReader(csvfile, delimiter=',', quotechar='\'')

      for row in csvreader:
        phone_number = row.get('Cell Phone', row.get('Cell Phone ', ''));

        if bool(phone_number_regex.match(phone_number)):
          if phone_number in phone_numbers_set:
            print '{} is a duplicate'.format(phone_number);
          else:
            if (TESTMODE != True):
              writer.writerow({
                  'first_name': row['FirstName'], 
                  'last_name': row['LastName'], 
                  'phone_number': phone_number,
                  'source_id_type': 'VAN',
                  'source_id': row['Voter File VANID']})
              phone_numbers_set.add(phone_number);
        else:
          print '{} does not look like a real phone number on row: \n\t{}'.format(phone_number, row);

def main(argv):
  INFILE = ''
  OUTFILE = ''
  TESTMODE = False

  try:
    opts, args = getopt.getopt(argv,"hi:o:",["infile=","outfile=","testmode="])
  except getopt.GetoptError:
    print 'dedupe.py -i <inputfile> -o <outputfile> -t <testmode>'
    sys.exit(2)
  for opt, arg in opts:
    if opt == '-h':
      print 'test.py -i <inputfile> -o <outputfile> -t <testmode>'
      sys.exit()
    elif opt in ("-i", "--infile"):
      INFILE = arg
    elif opt in ("-o", "--outfile"):
      OUTFILE = arg
    elif opt in ("-t", "--testmode"):
      TESTMODE = True

  print 'Input file is:', INFILE
  print 'Output file is:', OUTFILE
  print 'Test mode is:', TESTMODE

  processFile(INFILE, OUTFILE, TESTMODE)

if __name__ == "__main__":
   main(sys.argv[1:])