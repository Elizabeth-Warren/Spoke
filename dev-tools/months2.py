#!/usr/bin/env python3

import csv
import re
import sys, getopt

HOSTILE_FILE = './month2/hostile.csv'
LABELS_FILE = './month2/labels.csv'
OPTOUTS_FILE = './month2/optouts.csv'
STATUS_FILE = './month2/status.csv'
SQL_FILE = './month2/updates.sql'

HOSTILE_OR_WHO_IS_THIS_SLUG = 'hostile-or-who-is-this'

phone_number_regex = re.compile(r'\+?(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})')

contactsDict = {}
contactsMessagedRepliedSet = set()
contactsMessagedNotReplySet = set()

mustSkipSlugs = {'pssr', 'deceased', 'minor', 'moved'}
mightSkipSlugs = {HOSTILE_OR_WHO_IS_THIS_SLUG, 'notinterested', 'issuesgop'}
dontSkipSlugs = {'issueabt', 'issuehc', 'issuejobs', 'issueed', 'issueclm', 'issueecn', 'issuewi', 'issuefp', 'issuesj', 'issuegc', 'issueim', 'issuecrp', 'issueagr', 'issueo'}
repliedStatuses = {'convo', 'needsResponse', 'closed'}

class Contact:
    statusesUpdatedToClosed = 0
    statusesUpdatedToNeedsResponse = 0

    def __init__(self, voter_id, first_name, last_name, phone_number, labels, status, optout):
        self.voter_id = voter_id
        self.phone_number = phone_number
        self.first_name = first_name
        self.last_name = last_name
        self.labels = labels
        self.status = {status}
        self.optout = optout
        self.newStatus = None

    def show(self):
        print('voter_id: {}').format(self.voter_id);
        print('phone_number: {}').format(self.phone_number);
        print('first_name: {}').format(self.first_name);
        print('last_name: {}').format(self.last_name);
        print('labels: {}').format(self.labels);
        print('status: {}').format(self.status);
        print('optout: {}').format(self.optout);

    def addLabel(self, label):
        self.labels.add(label)

    def optOut(self):
        if (not self.optout):
            print "Changing optout from {} to True".format(self.optout)
        self.optout = True

    def didThisContactReply(self):
        if len(self.status.intersection(repliedStatuses)) > 0:
            return True
        elif ('needsMessage' in self.status):
            return None
        elif ('messaged' in self.status):
            return False

    def setNewStatus(self):
        mustSkipLabelsFound = self.labels.intersection(mustSkipSlugs)
        mightSkipLabelsFound = self.labels.intersection(mightSkipSlugs)
        dontSkipSlugsFound = self.labels.intersection(dontSkipSlugs)

        # print "Contact: {} mustSkipLabelsFound: {}  mightSkipLabelsFound: {}  dontSkipSlugsFound: {}  repliedStatusFound: {}". format(self.phone_number, mustSkipLabelsFound, mightSkipLabelsFound, dontSkipSlugsFound, repliedStatusFound)
        if not self.optout:
            if self.didThisContactReply():
                self.newStatus = 'needsResponse'
            
            if len(mustSkipLabelsFound) > 0:
                self.newStatus = 'closed'
            
            if (len(mightSkipLabelsFound) > 0) and (len(dontSkipSlugsFound) == 0):
                print "This contact has might skip labels: {} and num dont skips: {}".format(mightSkipLabelsFound, len(dontSkipSlugsFound))


def verifyFieldnames(fieldnames, expected_fieldnames):
  fieldnames_set = set(fieldnames)
  for fieldname in fieldnames:
      fieldnames_set.add(fieldname.strip())
  
  print ("Got fields {} expected {}").format(fieldnames_set, expected_fieldnames)

  return expected_fieldnames.issubset(fieldnames_set)

def processStatusFile():
    contactsOverWritten = 0;
    expected_fieldnames = {'is_opted_out', 'message_status', 'cell', 'last_name', 'first_name', 'external_id'}
    with open(STATUS_FILE, 'rb') as csvfile:
        csvreader = csv.DictReader(csvfile, delimiter=',', quotechar='\"')
        if verifyFieldnames(csvreader.fieldnames, expected_fieldnames):
            print 'Verified fieldnames in file: {}'.format(STATUS_FILE)
        else:
            print 'Aborting, could not Verify fieldnames in file:', STATUS_FILE
            sys.exit(1) 

        for row in csvreader:
            phone_number = row.get('cell')
            optout = None

            if row.get('is_opted_out') == 'true':
                optout = True
            elif  row.get('is_opted_out') == 'false':
                optout = False

            if bool(phone_number_regex.match(phone_number)):

                # TODO: Figure out what to do about over-writing contacts
                if contactsDict.get(phone_number):
                    print "WARNING: going to over-write contact: {}".format(phone_number)
                    contactsOverWritten += 1

                contactsDict[phone_number] = Contact(
                    voter_id=row.get('external_id'),
                    phone_number=phone_number,
                    first_name=row.get('first_name'),
                    last_name=row.get('last_name'),
                    labels={1,2,3},
                    status=row.get('message_status'),
                    optout=optout,
                )
            else: 
                print "WARNING: This dodgy phone number {} was found in the {} file, take a look asap".format(phone_number, STATUS_FILE)

    print "Added {} entries to the contacts dictionary".format(len(contactsDict))
    print "{} entries were over-written".format(contactsOverWritten)

def processLabelsFile():
    expected_fieldnames = {'slug', 'contact_number'}
    labelCount = 0
    rowNum = 0;
    
    with open(LABELS_FILE, 'rb') as csvfile:
        csvreader = csv.DictReader(csvfile, delimiter=',', quotechar='\'')
        if verifyFieldnames(csvreader.fieldnames, expected_fieldnames):
            print 'Verified fieldnames in file: {}'.format(LABELS_FILE)
        else:
            print 'Aborting, could not Verify fieldnames in file:', STATUS_FILE
            sys.exit(1) 

        for row in csvreader:
            rowNum += 1
            phone_number = row.get('contact_number', '')
            slug = row.get('slug', '')
            if (phone_number is not None) and (slug is not None) and (len(slug) > 0):
                if bool(phone_number_regex.match(phone_number)):
                    try:
                        contactsDict[phone_number].addLabel(slug)
                        labelCount += 1
                    except KeyError:
                        print "Trying to add labels to a contact that does not exist: {}".format(phone_number)
                else:
                    print "WARNING: This dodgy phone number {} was found in the {} file on row {}, take a look asap".format(phone_number, LABELS_FILE, rowNum)
            else:
                print "WARNING: This row {} had nones in it in {} file on row {}, take a look asap".format(row, LABELS_FILE, rowNum)          

    print "Added {} labels to the contacts dictionary".format(labelCount)
    
def processOptOutsFile():
    expected_fieldnames = {'cell'}
    optOutsCount = 0
    
    with open(OPTOUTS_FILE, 'rb') as csvfile:
        csvreader = csv.DictReader(csvfile, delimiter=',', quotechar='\'')
        if verifyFieldnames(csvreader.fieldnames, expected_fieldnames):
            print 'Verified fieldnames in file: {}'.format(OPTOUTS_FILE)
        else:
            print 'Aborting, could not Verify fieldnames in file:', OPTOUTS_FILE
            sys.exit(1) 

        for row in csvreader:
            phone_number = row.get('cell', '')
            if (phone_number is not None):
                if bool(phone_number_regex.match(phone_number)):
                    contactsDict[phone_number].optOut()
                    optOutsCount += 1
                else:
                    print "WARNING: This dodgy phone number {} was found in the {} file, take a look asap".format(phone_number, OPTOUTS_FILE)
            else:
                print "WARNING: This row {} had nones in it in {} file, take a look asap".format(row, OPTOUTS_FILE)          

    print "Processed OptOuts for {} contacts".format(optOutsCount)
    
def processHostileFile():
    expected_fieldnames = {'contact_number'}
    hostileCount = 0
    
    with open(HOSTILE_FILE, 'rb') as csvfile:
        csvreader = csv.DictReader(csvfile, delimiter=',', quotechar='\'')
        if verifyFieldnames(csvreader.fieldnames, expected_fieldnames):
            print 'Verified fieldnames in file: {}'.format(HOSTILE_FILE)
        else:
            print 'Aborting, could not Verify fieldnames in file:', HOSTILE_FILE
            sys.exit(1) 

        for row in csvreader:
            phone_number = row.get('contact_number', '')
            if (phone_number is not None):
                if bool(phone_number_regex.match(phone_number)):
                    contactsDict[phone_number].addLabel(HOSTILE_OR_WHO_IS_THIS_SLUG)
                    hostileCount += 1
                else:
                    print "WARNING: This dodgy phone number {} was found in the {} file, take a look asap".format(phone_number, HOSTILE_FILE)
            else:
                print "WARNING: This row {} had nones in it in {} file, take a look asap".format(row, HOSTILE_FILE)          

    print "Processed hostiles for {} contacts".format(hostileCount)

def processContactsIntoSets():
    for key in contactsDict:
        contactsDict[key].setNewStatus()

        if not contactsDict[key].optout:
            if contactsDict[key].didThisContactReply():
                contactsMessagedRepliedSet.add(contactsDict[key])
            elif contactsDict[key].didThisContactReply() == False:
                contactsMessagedNotReplySet.add(contactsDict[key])           
    print("Got {} contacts that replied").format(len(contactsMessagedRepliedSet))
    print("Got {} contacts that were messaged but did not reply").format(len(contactsMessagedNotReplySet))

def makeSQL():
    with open(SQL_FILE, 'w') as sqlfile:
        for contact in contactsMessagedRepliedSet:
            sqlfile.write('UPDATE campaign_contact SET message_status = \'{}\' WHERE cell = \'{}\';\n'.format(contact.newStatus, contact.phone_number))

def main():
    print HOSTILE_FILE, HOSTILE_FILE
    print LABELS_FILE, LABELS_FILE
    print OPTOUTS_FILE, OPTOUTS_FILE
    print STATUS_FILE, STATUS_FILE

    processStatusFile()
    processLabelsFile()
    processOptOutsFile()
    processHostileFile()
    processContactsIntoSets()
    makeSQL()     

if __name__ == "__main__":
    main()
