#!/usr/bin/env python3

import csv
import re
import sys, getopt

NOREPLY_FILE = 'noreply.csv'

phone_number_regex = re.compile(r'\+?(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})')
precinct_id_regex = re.compile('^\d{1,3}$')

textersDict = {}
cellSet = set()

class Contact:
    def __init__(self, voter_id, first_name, last_name, phone_number, precinct_id, filename):
        self.voter_id = voter_id
        self.phone_number = phone_number
        self.first_name = first_name
        self.last_name = last_name
        self.precinct_id = precinct_id
        self.filename = filename

    def get_row(self):
        return {
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'source_id_type': 'VAN',
            'source_id': self.voter_id,
        }

        
def verifyFieldnames(fieldnames, expected_fieldnames):
  fieldnames_set = set(fieldnames)
  for fieldname in fieldnames:
      fieldnames_set.add(fieldname.strip())
  
  print ("Got fields {} expected {}").format(fieldnames_set, expected_fieldnames)

  return expected_fieldnames.issubset(fieldnames_set)

def processNoreplyFile():
    expected_fieldnames = {'campaign_id','assignment_id','first_name','last_name','cell','external_id_type','external_id','user_id','texter_first_name','texter_last_name','title'}
    with open(NOREPLY_FILE, 'rb') as csvfile:
        csvreader = csv.DictReader(csvfile, delimiter=',', quotechar='\"')
        if verifyFieldnames(csvreader.fieldnames, expected_fieldnames):
            print 'Verified fieldnames in file: {}'.format(NOREPLY_FILE)
        else:
            print 'Aborting, could not Verify fieldnames in file:', NOREPLY_FILE
            sys.exit(1)

        for row in csvreader:
            first_name = row.get('first_name', '').strip()
            last_name = row.get('last_name', '').strip()
            phone_number = row.get('cell', '')
            precinct = row.get('title', '').strip()
            precinct_list = re.split('\W+', precinct)
            precinct_id = precinct_list[1].strip()
            texter_first_name = row.get('texter_first_name', '').strip()
            texter_first_name = texter_first_name.replace(" ", "_")
            texter_first_name = texter_first_name.replace(".", "")
            texter_last_name = row.get('texter_last_name', '').strip()
            texter_last_name = texter_last_name.replace(" ", "_")
            texter_last_name = texter_last_name.replace(" ", "_")
            texter = "{}_{}_{}".format(texter_first_name, texter_last_name, precinct_id)
            filename = "{}_{}".format(texter_first_name, texter_last_name[0])

            if (len(first_name) > 0) and (len(first_name) > 0) and (len(last_name) > 0) and (len(phone_number) > 0) and (len(precinct_id) > 0) and (len(texter_first_name) > 0)  and (len(texter_last_name) > 0) and (len(texter) > 0) and (len(filename) > 0):
                if bool(phone_number_regex.match(phone_number)):
                    if bool(precinct_id_regex.match(precinct_id)):
                        contact = Contact(
                            voter_id=row.get('external_id', '').strip(),
                            phone_number=phone_number,
                            first_name=first_name,
                            last_name=last_name,
                            precinct_id=precinct_id,
                            filename=filename,
                        )

                        if phone_number not in cellSet:
                            if texter in textersDict:
                                textersDict[texter].add(contact)
                            else:
                                textersDict[texter] = set()
                
                        cellSet.add(phone_number)
                    else: 
                        print "WARNING: This dodgy precinct id {} was found in the {} file, take a look asap. Precinct: {}".format(precinct_id, NOREPLY_FILE, precinct_list)
                else:
                    print "WARNING: This dodgy phone number {} was found in the {} file, take a look asap".format(phone_number, NOREPLY_FILE)
            else:
                print "WARNING: This row looks corrupted: {}".format(row)


def makeFiles():
    for key in textersDict:
        filelength = 0
        filenumber = 1

        for contact in textersDict[key]:
            fieldnames = ['first_name','last_name','phone_number','source_id_type','source_id']
            filename = "Precinct_{}_{}_NoReply_List_{}.csv".format(contact.precinct_id, contact.filename, filenumber)
            folder = './files/'

            if filelength == 0:
                print "Writing the header to file: {}".format(filename)
                with open("{}{}".format(folder, filename), 'w') as csvfile:
                    noreplywriter = csv.DictWriter(csvfile, delimiter=',', quotechar='\"', quoting=csv.QUOTE_MINIMAL, fieldnames=fieldnames)
                    noreplywriter.writeheader()
            
            else:
                with open("{}{}".format(folder, filename), 'a+') as csvfile:
                    noreplywriter = csv.DictWriter(csvfile, delimiter=',', quotechar='\"', quoting=csv.QUOTE_MINIMAL, fieldnames=fieldnames)

                    if filelength == 0:
                        print "Writing the header to file: {}".format(filename)
                        noreplywriter.writeheader()
                    
                    print(contact.get_row())
                    noreplywriter.writerow(contact.get_row())
            
            filelength += 1

            if filelength == 300:
                filenumber += 1
                filelength = 0


def main():
    print NOREPLY_FILE

    processNoreplyFile()   
    makeFiles()

if __name__ == "__main__":
    main()
