#!/usr/bin/env python3

import csv
import re
import sys, getopt

def verifyFieldnames(fieldnames):
  fieldnames_set = set(fieldnames)
  print "Got fieldnames: ", fieldnames_set
  for fieldname in fieldnames:
    fieldnames_set.add(fieldname.strip())
  
  expected_fieldnames = {'Voter File VANID', 'LastName', 'FirstName', 'Cell Phone'}
  return expected_fieldnames.issubset(fieldnames_set)

  expected_fieldnames_set = {'LastName', 'FirstName', 'Cell Phone', }
  
def processFile(INFILE, OUTFILE, SUBFILE='', TESTMODE=False, PROCESS_SUBFILE=False):
  phone_numbers_set = set()
  phone_numbers_dupes = []
  infile_length = 0
  outfile_length = 0
  last_names_with_invalid_numbers = []
  phone_number_regex = re.compile(r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})')

  with open(OUTFILE, 'w') as dedupe_csvfile:
    fieldnames = ['first_name', 'last_name', 'phone_number', 'source_id_type', 'source_id', 'subset']
    writer = csv.DictWriter(dedupe_csvfile, fieldnames=fieldnames)

    if (TESTMODE != True):
      writer.writeheader()
    else:
      print "IN TESTMODE: not writing any output"

    with open(INFILE, 'rb') as csvfile:
      csvreader = csv.DictReader(csvfile, delimiter=',', quotechar='\'')
      if verifyFieldnames(csvreader.fieldnames):
        print 'Verified fieldnames'
      else:
        print 'Aborting, could not Verify fieldnames in file:', INFILE
        sys.exit(1) 

      if PROCESS_SUBFILE:
        with open(SUBFILE, 'rb') as subcsvfile:
          subcsvreader = csv.DictReader(subcsvfile, delimiter=',', quotechar='\'')
          if verifyFieldnames(csvreader.fieldnames):
            print 'Verified fieldnames'
          else:
            print 'Aborting, could not Verify fieldnames in subfile:', SUBFILE
            sys.exit(1) 

          for row in subcsvreader:
            phone_number = row.get('phone_number', row.get('Cell Phone', ''));
            phone_numbers_set.add(phone_number)

          print "Got numbers out of subfile to remove:", phone_numbers_set

      print phone_numbers_set

      for row in csvreader:
        infile_length += 1
        phone_number = row.get('Cell Phone', row.get('Cell Phone ', ''));
        last_name = row.get('LastName', row.get('LastName ', ''));

        if bool(phone_number_regex.match(phone_number)):
          if phone_number in phone_numbers_set:
            phone_numbers_dupes.append(phone_number)
          else:
            phone_numbers_set.add(phone_number);
            if (TESTMODE != True):
              writer.writerow({
                  'first_name': row['FirstName'], 
                  'last_name': row['LastName'], 
                  'phone_number': phone_number,
                  'source_id_type': 'VAN',
                  'source_id': row['Voter File VANID']})
              outfile_length += 1
            else:
              print "IN TESTMODE: not writing any output"
        else:
          last_names_with_invalid_numbers.append(last_name)
  
  print '--------------------------------------'
  print 'Processed:', INFILE
  print 'INFILE length:', infile_length
  print 'Dupes found:', len(phone_numbers_dupes)
  print 'Lines skipped because of a bad number:', len(last_names_with_invalid_numbers)
  print 'Created (or not if in test mode):', OUTFILE
  print 'OUTFILE length:', outfile_length
  print 'Test mode is:', TESTMODE

  
def main(argv):
  INFILE = ''
  OUTFILE = ''
  SUBFILE = ''
  TESTMODE = False
  PROCESS_SUBFILE = False

  try:
    opts, args = getopt.getopt(argv,"hi:o:",["infile=", "subfile=", "outfile=","testmode="])
  except getopt.GetoptError:
    print 'dedupe.py -i <inputfile> -s <subfile> -o <outputfile> -t <testmode>'
    sys.exit(2)
  for opt, arg in opts:
    if opt == '-h':
      print 'test.py -i <inputfile> -s <subfile> -o <outputfile> -t <testmode>'
      sys.exit()
    elif opt in ("-i", "--infile"):
      INFILE = arg
    elif opt in ("-s", "--subfile"):
      SUBFILE = arg
      PROCESS_SUBFILE = True
    elif opt in ("-o", "--outfile"):
      OUTFILE = arg
    elif opt in ("-t", "--testmode"):
      TESTMODE = True

  print "INFILE", INFILE
  print "OUTFILE", OUTFILE
  print "SUBFILE", SUBFILE

  processFile(INFILE, OUTFILE, SUBFILE, TESTMODE, PROCESS_SUBFILE)

if __name__ == "__main__":
   main(sys.argv[1:])